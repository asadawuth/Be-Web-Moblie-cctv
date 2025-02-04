const Joi = require("joi");

const checkIdDataSosVoice = Joi.object({
  sosVoiceId: Joi.number().integer().positive().required(),
});
const findSosVoiceFormFirstNameLastName = Joi.object({
  firstName: Joi.string().trim().required(),
  lastName: Joi.string().trim().required(),
});

exports.checkIdDataSosVoice = checkIdDataSosVoice;
exports.findSosVoiceFormFirstNameLastName = findSosVoiceFormFirstNameLastName;
