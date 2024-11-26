import Joi from "joi";

export const groupCreationSchema = Joi.object({
  "group": {
    "group_name": Joi.string().trim().min(2).max(50).required().messages({
      "string.max": "Group name must be between 2 to 50 characters.",
      "any.required": "Group name is required."
    }),
    "group_description": Joi.string().trim(),
    "image_url": Joi.string()
  },
  "membersData": {
    "members": Joi.array().items(Joi.string().uuid().required()).required(),
    "admins": Joi.array().items(Joi.string().uuid().required()),
    "coadmins": Joi.array().items(Joi.string().uuid().required())
  }
});
