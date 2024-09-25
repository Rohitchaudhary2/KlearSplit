import Joi from "joi";

const userSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().max(128).required().messages({
    "string.email": "Please provide a valid email address.",
    "string.max": "Email must be less than or equal to 128 characters.",
    "any.required": "Email is required.",
  }),

  first_name: Joi.string().trim().max(50).required().messages({
    "string.max": "First name must be less than or equal to 50 characters.",
    "any.required": "First name is required.",
  }),

  last_name: Joi.string().trim().max(50).messages({
    "string.max": "Last name must be less than or equal to 50 characters.",
  }),

  phone: Joi.string()
    .trim()
    .pattern(/^[0-9]+$/)
    .length(10)
    .required()
    .messages({
      "string.pattern.base": "Phone number must contain only digits.",
      "string.length": "Phone number must be exactly 10 digits long.",
      "any.required": "Phone number is required.",
    }),
});

export const validateUser = (userData) => {
  return userSchema.validate(userData);
};

const updatedUserSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().max(128).messages({
    "string.email": "Please provide a valid email address.",
    "string.max": "Email must be less than or equal to 128 characters.",
    "any.required": "Email is required.",
  }),

  first_name: Joi.string().trim().max(50).messages({
    "string.max": "First name must be less than or equal to 50 characters.",
    "any.required": "First name is required.",
  }),

  last_name: Joi.string().trim().max(50).messages({
    "string.max": "Last name must be less than or equal to 50 characters.",
  }),

  password: Joi.string()
    .pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,20}$/,
    )
    .messages({
      "string.pattern.base":
        "Password must be at least 8 characters long and less than 20 characters, include at least one uppercase letter, one lowercase letter, one number, and one special character.",
      "any.required": "Password is required.",
    }),

  image_url: Joi.string()
    .uri({ scheme: ["http", "https"] })
    .max(255)
    .messages({
      "string.uri":
        "Image URL must be a valid URL and should start with http or https.",
      "string.max": "Image URL must be less than or equal to 255 characters.",
    }),

  notification_settings: Joi.number().integer().min(0).max(63).messages({
    "number.integer": "Notification settings must be an integer.",
    "number.min": "Notification settings must be at least 0.",
    "number.max": "Notification settings must be at most 63.",
  }),

  phone: Joi.string()
    .trim()
    .pattern(/^[0-9]+$/)
    .length(10)
    .messages({
      "string.pattern.base": "Phone number must contain only digits.",
      "string.length": "Phone number must be exactly 10 digits long.",
      "any.required": "Phone number is required.",
    }),
});

export const validateUpdatedUser = (userData) => {
  return updatedUserSchema.validate(userData);
};
