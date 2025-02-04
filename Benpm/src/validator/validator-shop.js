const Joi = require("joi");

const findShopFormFirstNameLastName = Joi.object({
  first_name: Joi.string().trim().required(),
  last_name: Joi.string().trim().required(),
});

const checkIdDataShopSchema = Joi.object({
  datashopId: Joi.number().integer().positive().required(),
});

exports.findShopFormFirstNameLastName = findShopFormFirstNameLastName;
exports.checkIdDataShopSchema = checkIdDataShopSchema;
