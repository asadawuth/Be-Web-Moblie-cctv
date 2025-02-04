const Joi = require("joi");

const checkIdDataReportTitleSchema = Joi.object({
  reportId: Joi.number().integer().positive().required(),
});

const findReportFormFirstNameLastName = Joi.object({
  first_name: Joi.string().trim().required(),
  last_name: Joi.string().trim().required(),
});

exports.checkIdDataReportTitleSchema = checkIdDataReportTitleSchema;
exports.findReportFormFirstNameLastName = findReportFormFirstNameLastName;
