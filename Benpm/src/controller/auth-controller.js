const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../model/prisma.js");
const createError = require("../middleware/error.js");
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs").promises;
const {
  idRegisterSchema,
  loginSchema,
  updateDataIdScheme,
  changePasswordUserSchema,
  resetEmailSchema,
  verifyEmailSchema,
  verifyOptSchema,
  resetPasswordSchema,
  findIdEmployeeForDeleteShema,
  checkIdLoginEmployeeForDeleteShema,
} = require("../validator/validator-user.js");

// REGISTER LOGIN GETDATAUSER UPDATEDATAUSER UPDATEPROFILE SETDEFAULTPROFILE
exports.registerIdEmployee = async (req, res, next) => {
  try {
    const { value, error } = idRegisterSchema.validate(req.body);
    if (error) {
      return next(error);
    }

    const existingPhone = await prisma.user.findFirst({
      where: { phone: value.phone },
    });

    if (existingPhone) {
      return next(createError("Phone number already exists.", 400));
    }

    const existingEmail = await prisma.user.findFirst({
      where: { email: value.email },
    });

    if (existingEmail) {
      return next(createError("Email already exists", 400));
    }

    value.password = await bcrypt.hash(value.password, 12);

    const idUser = await prisma.user.create({
      data: {
        firstName: value.firstName,
        lastName: value.lastName,
        email: value.email,
        phone: value.phone,
        password: value.password,
        status: value.status,
        profile: null,
      },
    });
    delete idUser.password;
    res.status(200).json({ message: "Created successfully", idUser });
  } catch (error) {
    next(error);
  }
};
exports.login = async (req, res, next) => {
  try {
    const { value, error } = loginSchema.validate(req.body);
    if (error) {
      return next(error);
    }

    const emailOrMobile = value.emailOrMobile;

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrMobile }, { phone: emailOrMobile }],
      },
    });

    if (!user) {
      return next(createError("Invalid credentials", 401));
    }

    const isMatch = await bcrypt.compare(value.password, user.password);
    if (!isMatch) {
      return next(createError("Invalid credentials", 401));
    }

    const payload = { id: user.id };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET_KEY || "AQZ", {
      expiresIn: process.env.JWT_EXPIRE || "1h",
    });
    delete user.password;
    res.status(200).json({
      accessToken,
      user,
    });
  } catch (error) {
    next(error);
  }
};
exports.getUserAuth = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "User not authenticated." });
  }
  res.json({
    user: {
      id: req.user.id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      phone: req.user.phone,
      status: req.user.status,
      profile: req.user.profile,
    },
  });
};
exports.updateDataId = async (req, res, next) => {
  try {
    const { value, error } = updateDataIdScheme.validate(req.body);
    if (error) {
      return next(error);
    }

    const userId = req.user.id;

    const findData = await prisma.user.findFirst({
      where: { id: userId },
    });

    if (!findData) {
      return next(createError(404, "User not found"));
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: value.firstName,
        lastName: value.lastName,
        email: value.email,
        phone: value.phone,
      },
    });

    delete updatedUser.password;
    res.status(200).json({
      message: "Data updated successfully",
      updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
exports.updateProfile = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(createError(400, "Profile image is required"));
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        profile: true,
      },
    });

    if (user && user.profile) {
      const oldImagePath = path.join(
        __dirname,
        "../../public",
        user.profile.split("/").pop()
      );
      fs.unlink(oldImagePath, (err) => {
        if (err) {
          console.error(`Failed to delete old image: ${err}`);
        }
      });
    }

    const url = `${req.protocol}://${req.get("host")}/public/${
      req.file.filename
    }`;
    await prisma.user.update({
      data: {
        profile: url,
      },
      where: {
        id: req.user.id,
      },
    });
    res
      .status(200)
      .json({ message: "Profile image updated successfully", profileUrl: url });
  } catch (error) {
    next(error);
  }
};
exports.changeProfileToDefaultImage = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        profile: true,
      },
    });

    if (!user) {
      return next(createError(404, "User not found"));
    }

    if (user && user.profile) {
      const oldImagePath = path.join(
        __dirname,
        "../../public",
        user.profile.split("/").pop() // ดึงเฉพาะชื่อไฟล์มา
      );
      try {
        await fs.unlink(oldImagePath);
        console.log("Old image deleted successfully.");
      } catch (err) {
        console.error(`Failed to delete old image: ${err}`);
      }
    }
    await prisma.user.update({
      where: {
        id: req.user.id,
      },
      data: {
        profile: null,
      },
    });

    res.status(200).json({ message: "Set default profile successfully." });
  } catch (error) {
    next(error);
  }
};

// SEARCH FOR DELETE ID ใช้กับพนักงานที่พ้นสภาพ
exports.getForDeleteIdLoginEmployee = async (req, res, next) => {
  try {
    const { value, error } = findIdEmployeeForDeleteShema.validate(req.params);
    if (error) {
      next(error);
    }

    const { firstName, lastName } = value;

    const employee = await prisma.user.findFirst({
      where: {
        firstName: firstName,
        lastName: lastName,
      },
    });

    if (!employee) {
      next(createError("Id has a not found.", 400));
    }

    res.status(200).json({
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
    });
  } catch (error) {
    next(error);
  }
};
exports.deleteIduser = async (req, res, next) => {
  try {
    const { value, error } = checkIdLoginEmployeeForDeleteShema.validate(
      req.params
    );
    if (error) {
      return next(error);
    }

    const { employeeIdLogin } = value;

    const user = await prisma.user.findUnique({
      where: { id: Number(employeeIdLogin) },
    });

    if (!user) {
      return next(createError(404, "Employee not found."));
    }
    await prisma.user.delete({
      where: { id: Number(employeeIdLogin) },
    });
    return res.status(200).json({ message: "Delete Employee Successfully" });
  } catch (error) {
    next(error);
  }
};

// CHANGEUSERPASSWORDANDEMAIL
exports.changePassword = async (req, res, next) => {
  try {
    const { value, error } = changePasswordUserSchema.validate(req.body);
    if (error) {
      next(error);
    }

    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return next(createError("User not found", 404));
    }

    const isMatch = await bcrypt.compare(value.oldPassword, user.password);

    if (!isMatch) {
      return next(createError("Incorrect old password", 400));
    }
    const newPasswordHash = await bcrypt.hash(value.newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: newPasswordHash },
    });
    delete user.password;
    delete user.phone;
    delete user.email;
    res.status(200).json({ message: "Password changed successfully", user });
  } catch (error) {
    next(error);
  }
};
exports.changeEmail = async (req, res, next) => {
  try {
    const { error } = resetEmailSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.message });
    }
    const { oldEmail, newEmail, confirmNewEmail } = req.body;

    const findEmail = await prisma.user.findFirst({
      where: { email: oldEmail },
    });

    if (newEmail !== confirmNewEmail) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    if (!findEmail) {
      return res.status(400).json({ message: "Old email not found" });
    }

    const emailExists = await prisma.user.findFirst({
      where: { email: newEmail },
    });
    if (emailExists) {
      return res.status(400).json({ message: "New email is already in use" });
    }

    await prisma.user.update({
      where: { id: findEmail.id },
      data: { email: newEmail },
    });
    res.status(200).json({ message: "Email changed successfully" });
  } catch (error) {
    next(error);
  }
};

// ABOUT FORGOTPASSWORD OTP 4 LENGHT
exports.verifyEmail = async (req, res, next) => {
  try {
    const { error } = verifyEmailSchema.validate(req.body);
    if (error) {
      return res.status(400).json(createError("Email is required", 400));
    }

    const email = req.body.email;
    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      return res.status(400).json(createError("Email is required", 400));
    }

    res.status(200).json({ id: user.id, email: user.email });
  } catch (error) {
    next(error);
  }
};
exports.createOtp = async (req, res, next) => {
  try {
    const { error } = verifyEmailSchema.validate(req.body);
    if (error) {
      return next(error);
    }

    const email = req.body.email;

    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      return next(createError("Email has a not found.", 400));
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const existingOtp = await prisma.otp.findFirst({
      where: { userId: user.id },
    });

    if (existingOtp) {
      await prisma.otp.update({
        where: { id: existingOtp.id },
        data: {
          otp: otp,
        },
      });
    } else {
      await prisma.otp.create({
        data: {
          userId: user.id,
          otp: otp,
        },
      });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.USEREMAIL,
        pass: process.env.PASSWORD,
      },
    });

    const mailOptions = {
      from: "taodewy@gmail.com",
      to: user.email,
      subject: "รหัส OTP ของคุณจาก เเมสเซอวิส",
      text: `รหัสผ่านของคุณ คือ ${otp}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        next(error);
      } else {
        console.log("OTP email sent:", info.response);
        res.status(200).json({
          message: "Database has an email otp for user",
          user: {
            id: user.id,
            email: user.email,
          },
        });
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const { error } = verifyOptSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const { id, otp } = req.body;

    const existingOtp = await prisma.otp.findFirst({
      where: { userId: id },
    });

    if (!existingOtp) {
      return next(createError("", 400));
    }

    if (existingOtp.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    await prisma.otp.delete({
      where: { id: existingOtp.id },
    });

    res.status(200).json({
      user: {
        id: id,
        message: "OTP verified successfully",
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    // ตรวจสอบข้อมูลที่ส่งมาจากผู้ใช้
    const { error } = resetPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const { id, newPassword, confirmPassword } = req.body;

    // ตรวจสอบว่ารหัสผ่านใหม่ตรงกันหรือไม่
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // ตรวจสอบผู้ใช้จากฐานข้อมูล
    const user = await prisma.user.findFirst({
      where: { id: id },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // เข้ารหัสรหัสผ่านใหม่
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log("Hashed password:", hashedPassword);

    // อัปเดตรหัสผ่านในฐานข้อมูล
    await prisma.user.update({
      where: { id: id },
      data: { password: hashedPassword },
    });

    console.log("Password updated for user:", id);
    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    next(error);
  }
};
