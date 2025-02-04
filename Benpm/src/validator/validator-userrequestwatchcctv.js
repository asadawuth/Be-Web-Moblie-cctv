const Joi = require("joi");

const checkIdDataRequestcctvSchema = Joi.object({
  requestId: Joi.number().integer().positive().required(),
});

const findIdRequestWatchcctvFormFirstNameLastName = Joi.object({
  firstName: Joi.string().trim().required(),
  lastName: Joi.string().trim().required(),
});

exports.checkIdDataRequestcctvSchema = checkIdDataRequestcctvSchema;
exports.findIdRequestWatchcctvFormFirstNameLastName =
  findIdRequestWatchcctvFormFirstNameLastName;
