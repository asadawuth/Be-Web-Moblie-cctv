const Joi = require("joi");

const idRegisterSchema = Joi.object({
  firstName: Joi.string().trim().required(),
  lastName: Joi.string().trim().required(),
  email: Joi.string().email().allow("").required(),
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .allow("")
    .required(),
  password: Joi.string()
    .min(8)
    .max(12)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,12}$/)
    .trim()
    .required(),
  confirmPassword: Joi.string()
    .valid(Joi.ref("password"))
    .trim()
    .required()
    .strip(),
  status: Joi.string()
    .valid(
      "ผู้ดูแลระบบ",
      "ผู้ดำเนินการศูนย์บัญชาการ",
      "เจ้าหน้าที่ซ่อมบำรุง",
      "ประชาชน"
    )
    .required(),
});

const loginSchema = Joi.object({
  emailOrMobile: Joi.string().required(),
  password: Joi.string().required(),
});

const updateDataIdScheme = Joi.object({
  firstName: Joi.string().trim().required(),
  lastName: Joi.string().trim().required(),
  email: Joi.string().email().allow("").optional(),
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .allow("")
    .optional(),
});

const changePasswordUserSchema = Joi.object({
  oldPassword: Joi.string().trim().required(),
  newPassword: Joi.string()
    .required()
    .trim()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,12}$/),
  confirmNewPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .trim()
    .required(),
});

const resetPasswordSchema = Joi.object({
  id: Joi.number().required(),
  newPassword: Joi.string()
    .min(8)
    .max(12)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,12}$/)
    .trim()
    .required(),
  confirmPassword: Joi.string().valid(Joi.ref("newPassword")).trim().required(),
});

const resetEmailSchema = Joi.object({
  oldEmail: Joi.string().trim().email().required(),
  newEmail: Joi.string().trim().email().required(),
  confirmNewEmail: Joi.string().valid(Joi.ref("newEmail")).trim().required(),
});
const verifyEmailSchema = Joi.object({
  email: Joi.string().email().required(),
});
const verifyOptSchema = Joi.object({
  id: Joi.number().required(),
  otp: Joi.string()
    .length(4)
    .pattern(/^[0-9]+$/)
    .required(),
});
const checkIdDataEmployeeDeleteShema = Joi.object({
  employeeId: Joi.number().integer().positive().required(),
});
const checkIdLoginEmployeeForDeleteShema = Joi.object({
  employeeIdLogin: Joi.number().integer().positive().required(),
});
const findIdEmployeeForDeleteShema = Joi.object({
  firstName: Joi.string().trim().required(),
  lastName: Joi.string().trim().required(),
});

exports.idRegisterSchema = idRegisterSchema;
exports.loginSchema = loginSchema;
exports.updateDataIdScheme = updateDataIdScheme;
exports.changePasswordUserSchema = changePasswordUserSchema;
exports.resetEmailSchema = resetEmailSchema;
exports.verifyEmailSchema = verifyEmailSchema;
exports.verifyOptSchema = verifyOptSchema;
exports.resetPasswordSchema = resetPasswordSchema;
exports.findIdEmployeeForDeleteShema = findIdEmployeeForDeleteShema;
exports.checkIdDataEmployeeDeleteShema = checkIdDataEmployeeDeleteShema;
exports.checkIdLoginEmployeeForDeleteShema = checkIdLoginEmployeeForDeleteShema;
