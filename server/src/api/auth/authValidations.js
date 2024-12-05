import Joi from "joi";

export const loginSchema = Joi.object({
  "email": Joi.string().trim().lowercase().email().max(128).required().messages({
    "string.email": "Please provide a valid email address.",
    "string.max": "Email must be less than or equal to 128 characters.",
    "any.required": "Email is required."
  }),
  "password": Joi.string().trim().required()
});
