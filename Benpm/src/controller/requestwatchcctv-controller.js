const createError = require("../middleware/error.js");
const prisma = require("../model/prisma.js");
const fs = require("fs");
const path = require("path");
const {
  checkIdDataRequestcctvSchema,
  findIdRequestWatchcctvFormFirstNameLastName,
} = require("../validator/validator-userrequestwatchcctv.js");

exports.createRequestWatchcctv = async (req, res, next) => {
  try {
    const { firstName, lastName, tel, nationalId, numDocument, point, status } =
      req.body;
    const userId = req.user?.id;

    if (!userId) {
      return next(createError("User ID is Required"), 400);
    }
    if (
      !firstName ||
      !lastName ||
      !tel ||
      !nationalId ||
      !numDocument ||
      !point ||
      !status
    ) {
      return next(createError("Missing required fields", 400));
    }

    const image = req.file
      ? `${req.protocol}://${req.get("host")}/public/${req.file.filename}`
      : null;

    if (!image) {
      return next(createError("Image is required", 400));
    }

    const newPost = await prisma.requestwatchcctv.create({
      data: {
        firstName,
        lastName,
        tel,
        nationalId,
        numDocument,
        point,
        status,
        image,
        userId: userId,
      },
    });

    // ส่งข้อมูลผ่าน Socket.IO
    try {
      if (req.io) {
        req.io.emit("newRequestWatchcctv", {
          message: `Request CCTV created by: ${newPost.status}`,
          postId: newPost.id,
        });
      } else {
        console.warn("Socket.IO is not initialized for this request");
      }
    } catch (ioError) {
      console.error("Socket.IO error:", ioError);
    }

    res.status(200).json(newPost);
  } catch (error) {
    console.error("Error creating CCTV request:", error);
    next(error);
  }
};

exports.changeDocumentRequestWatchcctv = async (req, res, next) => {
  try {
    const { value, error } = checkIdDataRequestcctvSchema.validate(req.params);
    if (error) {
      return next(createError("Invalid report ID", 400));
    }

    const requestToChangeDataDocument = await prisma.requestwatchcctv.findFirst(
      {
        where: { id: parseInt(value.requestId) },
      }
    );

    if (!requestToChangeDataDocument) {
      return next(createError("Report ID not found", 404));
    }

    const deleteFile = (fileUrl) => {
      const filePath = path.join(
        __dirname,
        "../../public",
        path.basename(fileUrl.trim())
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    };

    // ตรวจสอบว่ามีไฟล์ใหม่หรือไม่
    let newImage;
    if (req.file) {
      // ลบไฟล์เก่าถ้ามี
      if (requestToChangeDataDocument.image) {
        deleteFile(requestToChangeDataDocument.image);
      }

      // ใช้ไฟล์ใหม่
      newImage = `${req.protocol}://${req.get("host")}/public/${
        req.file.filename
      }`;
    } else {
      // ใช้ไฟล์เดิม
      newImage = requestToChangeDataDocument.image;
    }

    // อัปเดตข้อมูลในฐานข้อมูล
    const updatedRequest = await prisma.requestwatchcctv.update({
      where: { id: parseInt(value.requestId) },
      data: {
        image: newImage,
        firstName: req.body.firstName || requestToChangeDataDocument.firstName,
        lastName: req.body.lastName || requestToChangeDataDocument.lastName,
        tel: req.body.tel || requestToChangeDataDocument.tel,
        nationalId:
          req.body.nationalId || requestToChangeDataDocument.nationalId,
        numDocument:
          req.body.numDocument || requestToChangeDataDocument.numDocument,
        point: req.body.point || requestToChangeDataDocument.point,
        status: req.body.status || requestToChangeDataDocument.status,
      },
    });

    res.status(200).json({
      message: "Document updated successfully",
      data: updatedRequest,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateStatusRequest = async (req, res, next) => {
  try {
    const { value, error } = checkIdDataRequestcctvSchema.validate(req.params);
    if (error) {
      return next(createError("Invalid report ID", 400));
    }

    const requestToChangeDataDocument = await prisma.requestwatchcctv.findFirst(
      {
        where: { id: parseInt(value.requestId) },
      }
    );

    if (!requestToChangeDataDocument) {
      return next(createError("Report ID not found", 404));
    }

    const updateStatusRequest = await prisma.requestwatchcctv.update({
      where: { id: parseInt(value.requestId) },
      data: {
        status: req.body.status,
      },
    });

    res.status(200).json({
      message: "Status updated successfully",
      data: updateStatusRequest,
    });
  } catch (error) {
    next(error);
  }
};

exports.sendMessageCassNotpass = async (req, res, next) => {
  try {
    const { value, error } = checkIdDataRequestcctvSchema.validate(req.params);
    if (error) {
      return next(createError("Invalid report ID", 400));
    }

    const requestToChangeDataDocument = await prisma.requestwatchcctv.findFirst(
      {
        where: { id: parseInt(value.requestId) },
      }
    );

    if (!requestToChangeDataDocument) {
      return next(createError("Report ID not found", 404));
    }

    if (!req.body.remark) {
      return next(createError("Remark is required", 400));
    }

    const updateStatusRequest = await prisma.requestwatchcctv.update({
      where: { id: parseInt(value.requestId) },
      data: {
        remark: req.body.remark,
      },
    });

    res.status(200).json({
      message: "Remark updated successfully",
      data: updateStatusRequest,
    });
  } catch (error) {
    next(error); // ส่ง error ไปที่ Middleware
  }
};

exports.dataListNotpassAndSenddocument = async (req, res, next) => {
  try {
    const _limit = 15; // จำนวณข้อมูล
    const { _page } = req.query; // จำนวณหน้าปัจจุบัน
    const skip = (_page - 1) * _limit; // คำนวณข้อมูลเริ่มต้น //ex 2-1 1*15 = 15

    const dataSendDocumentAndNotpass = await prisma.requestwatchcctv.findMany({
      where: {
        OR: [{ status: "ไม่ผ่าน" }, { status: "ยื่นเอกสาร" }],
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      skip, // เริ่มต้น ex 15
      take: _limit, // 15
    });

    const totalCount = await prisma.requestwatchcctv.count({
      where: {
        OR: [{ status: "ไม่ผ่าน" }, { status: "ยื่นเอกสาร" }],
      },
    }); // นับ

    const totalPages = Math.ceil(totalCount / _limit); // ex  17    17/15 = 1.133  => 2

    const dataToSendDocumentAndNotpassPage = dataSendDocumentAndNotpass.map(
      (item, index) => {
        const { createdAt, updatedAt, ...rest } = item; // destructuring  rest ค่าต่างๆเก็บเอาไว้

        const displayTime =
          Math.abs(updatedAt.getTime() - createdAt.getTime()) < 10000
            ? { type: "โพสเมื่อ", time: createdAt }
            : { type: "อัพเดทเมื่อ", time: updatedAt };

        return {
          ...rest,
          createdAt,
          updatedAt,
          ...displayTime,
          num: skip + index + 1,
        }; // ...rest ข้อมูลเดิม displayTime โคลนทับ
      }
    );

    res.status(200).json({
      pages: Array.from({ length: totalPages }, (_, i) => i + 1), //  ex 17 17/15 = 1.133 => 2  =>  1  2
      totalPages, // 1   0-15
      dataToSendDocumentAndNotpassPage,
    });
  } catch (error) {
    next(error);
  }
};

exports.dataNameRequest = async (req, res, next) => {
  try {
    const { value, error } =
      findIdRequestWatchcctvFormFirstNameLastName.validate(req.params);
    if (error) {
      return next(createError("Invalid name", 400));
    }

    const { firstName, lastName } = value;

    const dataPersonRequest = await prisma.requestwatchcctv.findMany({
      where: {
        firstName: firstName,
        lastName: lastName,
        NOT: {
          status: "ผ่าน",
        },
      },
    });

    const dataWithNum = dataPersonRequest.map((item, index) => {
      const { createdAt, updatedAt, ...rest } = item;

      const displayTime =
        updatedAt &&
        createdAt &&
        Math.abs(updatedAt.getTime() - createdAt.getTime()) < 10000
          ? { type: "โพสเมื่อ", time: createdAt }
          : { type: "อัพเดทเมื่อ", time: updatedAt || createdAt };

      return {
        ...rest,
        createdAt,
        updatedAt,
        ...displayTime,
        num: index + 1,
      };
    });

    res.status(200).json({
      message: "Filtered data retrieved successfully",
      dataPersonRequest: dataWithNum,
    });
  } catch (error) {
    console.error("Error fetching dataNameRequest:", error);
    next(error);
  }
};

exports.dataListPassOnly = async (req, res, next) => {
  try {
    const dataPassOnly = await prisma.requestwatchcctv.findMany({
      where: {
        status: "ผ่าน",
      },
    });

    const _limit = 12;
    const { _page } = req.query;
    const start = (_page - 1) * _limit;
    const end = start + _limit;
    const dataRequestPassOnly = dataPassOnly
      .slice(start, end)
      .map((item, index) => ({
        ...item,
        num: start + index + 1,
      }));
    const totalPages = Math.ceil(dataPassOnly.length / _limit);

    let pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    res.status(200).json({
      pages,
      totalPages,
      dataRequestPassOnly,
    });
  } catch (error) {
    next(error);
  }
};

exports.dataListNotpassOnly = async (req, res, next) => {
  try {
    const _limit = 12; // จำนวนข้อมูลต่อหน้า
    const _page = parseInt(req.query._page, 10) || 1; // หน้าปัจจุบัน กำหนดค่าเริ่มต้นเป็น 1
    const skip = (_page - 1) * _limit; // คำนวณข้อมูลเริ่มต้น

    // ดึงข้อมูลที่สถานะเป็น "ไม่ผ่าน"
    const dataNotpassOnly = await prisma.requestwatchcctv.findMany({
      where: {
        status: "ไม่ผ่าน",
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      skip,
      take: _limit,
    });
    const totalCount = await prisma.requestwatchcctv.count({
      where: {
        status: "ไม่ผ่าน",
      },
    });

    const totalPages = Math.ceil(totalCount / _limit);

    const dataNotPass = dataNotpassOnly.map((item, index) => {
      const { createdAt, updatedAt, ...rest } = item;
      const displayTime =
        updatedAt &&
        createdAt &&
        Math.abs(updatedAt.getTime() - createdAt.getTime()) < 10000
          ? { type: "โพสเมื่อ", time: createdAt }
          : { type: "อัพเดทเมื่อ", time: updatedAt || createdAt };

      return {
        ...rest,
        createdAt,
        updatedAt,
        ...displayTime,
        num: skip + index + 1,
      };
    });

    res.status(200).json({
      pages:
        totalPages > 0
          ? Array.from({ length: totalPages }, (_, i) => i + 1)
          : [],
      totalPages,
      dataNotPass: dataNotPass,
    });
  } catch (error) {
    console.error("Error fetching dataNotpassOnly:", error);
    next(error);
  }
};

exports.dataListSenddocumentOnly = async (req, res, next) => {
  try {
    const _limit = 12; // จำนวนข้อมูลต่อหน้า
    const _page = parseInt(req.query._page, 10) || 1; // หน้าปัจจุบัน กำหนดค่าเริ่มต้นเป็น 1
    const skip = (_page - 1) * _limit; // คำนวณข้อมูลเริ่มต้น
    const dataSendDocumentOnly = await prisma.requestwatchcctv.findMany({
      where: {
        status: "ยื่นเอกสาร",
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      skip,
      take: _limit,
    });

    const totalCount = await prisma.requestwatchcctv.count({
      where: {
        status: "ยื่นเอกสาร",
      },
    });
    const totalPages = Math.ceil(totalCount / _limit);
    const dataSendDocument = dataSendDocumentOnly.map((item, index) => {
      const { createdAt, updatedAt, ...rest } = item;
      const displayTime =
        updatedAt &&
        createdAt &&
        Math.abs(updatedAt.getTime() - createdAt.getTime()) < 10000
          ? { type: "โพสเมื่อ", time: createdAt }
          : { type: "อัพเดทเมื่อ", time: updatedAt || createdAt };

      return {
        ...rest,
        createdAt,
        updatedAt,
        ...displayTime,
        num: skip + index + 1,
      };
    });

    res.status(200).json({
      pages:
        totalPages > 0
          ? Array.from({ length: totalPages }, (_, i) => i + 1)
          : [],
      totalPages,
      dataSendDocument,
    });
  } catch (error) {
    next(error);
  }
};

exports.dataPersonCassPass = async (req, res, next) => {
  try {
    const { value, error } =
      findIdRequestWatchcctvFormFirstNameLastName.validate(req.params);
    if (error) {
      return next(createError("Invalid name", 400));
    }

    const { firstName, lastName } = value;

    const dataPersonRequest = await prisma.requestwatchcctv.findMany({
      where: {
        firstName: firstName,
        lastName: lastName,
        NOT: {
          status: {
            in: ["ไม่ผ่าน", "ยื่นเอกสาร"],
          },
        },
      },
    });

    res.status(200).json({
      message: "Filtered data retrieved successfully",
      data: dataPersonRequest,
    });
  } catch (error) {
    next(error);
  }
};

exports.totalAllData = async (req, res, next) => {
  try {
    const totalAllData = await prisma.requestwatchcctv.count();
    const totalSendDocument = await prisma.requestwatchcctv.count({
      where: {
        status: "ยื่นเอกสาร",
      },
    });
    const totalDocumentNotpass = await prisma.requestwatchcctv.count({
      where: {
        status: "ไม่ผ่าน",
      },
    });
    const totalDocumentPass = await prisma.requestwatchcctv.count({
      where: {
        status: "ผ่าน",
      },
    });

    res.status(200).json({
      totalAllData,
      totalSendDocument,
      totalDocumentNotpass,
      totalDocumentPass,
    });
  } catch (error) {
    next(error);
  }
};

exports.dataPersonPassOnly = async (req, res, next) => {
  try {
    const { value, error } =
      findIdRequestWatchcctvFormFirstNameLastName.validate(req.params);
    if (error) {
      return next(createError("Invalid name", 400));
    }

    const { firstName, lastName } = value;

    const dataPersonRequest = await prisma.requestwatchcctv.findMany({
      where: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        status: "ผ่าน",
      },
    });

    res.status(200).json({
      message: "Filtered data retrieved successfully",
      dataPersonRequest,
    });
  } catch (error) {
    next(error);
  }
};
