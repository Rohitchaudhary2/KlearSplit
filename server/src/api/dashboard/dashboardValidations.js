import Joi from "joi";

export const year = Joi.object({
  "year": Joi.number().integer()
    .min(1000)
    .max(9999)
    .required()
    .messages({
      "number.base": "Year must be a number",
      "number.min": "Year must be a 4-digit number",
      "number.max": "Year must be a 4-digit number",
      "any.required": "Year is required"
    })
});
