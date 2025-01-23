import Joi from "joi";

// Common fields for both create and update
const commonFields = {
  "email": Joi.string().trim().lowercase().email().max(128).required().messages({
    "string.email": "Please provide a valid email address.",
    "string.max": "Email must be less than or equal to 128 characters.",
    "any.required": "Email is required."
  }),

  "first_name": Joi.string().trim().min(2).max(50).required().messages({
    "string.max": "First name must be less than or equal to 50 characters.",
    "any.required": "First name is required."
  })
};

const optionalCommonFields = {
  "phone": Joi.string()
    .trim()
    .pattern(/^\d+$/)
    .length(10)
    .optional()
    .messages({
      "string.pattern.base": "Phone number must contain only digits.",
      "string.length": "Phone number must be exactly 10 digits long.",
      "any.required": "Phone number is required."
    }),

  "last_name": Joi.string().trim().max(50).messages({
    "string.max": "Last name must be less than or equal to 50 characters."
  })
};

export const emailSchema = Joi.object({
  "email": commonFields.email
});

// Create Schema: All Common fields required
export const createUserSchema = Joi.object({
  ...Object.keys(commonFields).reduce((acc, key) => {
    acc[ key ] = commonFields[ key ].required();
    return acc;
  }, {}),

  ...optionalCommonFields,

  "otp": Joi.string().trim()
});

export const updateUserSchema = Joi.object({
  ...Object.keys(commonFields).reduce((acc, key) => {
    acc[ key ] = commonFields[ key ].optional();
    return acc;
  }, {}),

  ...optionalCommonFields,

  "password": Joi.string().min(8).max(20)
    .messages({
      "string.pattern.base":
      "Password must be at least 8 characters long and less than 20 characters, include at least one uppercase letter, one lowercase letter, one number, and one special character.",
      "any.required": "Password is required."
    }),

  "new_password": Joi.string()
    .pattern(
      // /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,20}$/
      /^(?=.*[a-z])(?=.*\d)[A-Za-z\d!@#$%^&*]{8,20}$/
    )
    .messages({
      "string.pattern.base":
        "Password must be at least 8 characters long and less than 20 characters, include at least one uppercase letter, one lowercase letter, one number, and one special character.",
      "any.required": "Password is required."
    }),

  "image_url": Joi.string()
    .uri({ "scheme": [ "http", "https" ] })
    .max(255)
    .messages({
      "string.uri":
        "Image URL must be a valid URL and should start with http or https.",
      "string.max": "Image URL must be less than or equal to 255 characters."
    }),

  "notification_settings": Joi.number().integer().min(0).max(63).messages({
    "number.integer": "Notification settings must be an integer.",
    "number.min": "Notification settings must be at least 0.",
    "number.max": "Notification settings must be at most 63."
  })
});

export const restoreUserSchema = Joi.object({
  "email": commonFields.email,
  "otp": Joi.string().trim().optional()
});
