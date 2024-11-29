import Joi from "joi";

const memberData = {
  "membersData": {
    "members": Joi.array().items(Joi.string().uuid().required()).required(),
    "admins": Joi.array().items(Joi.string().uuid().required()),
    "coadmins": Joi.array().items(Joi.string().uuid().required())
  }
};

export const groupCreationSchema = Joi.object({
  "group": {
    "group_name": Joi.string().trim().min(2).max(50).required().messages({
      "string.max": "Group name must be between 2 to 50 characters.",
      "any.required": "Group name is required."
    }),
    "group_description": Joi.string().trim(),
    "image_url": Joi.string()
  },
  ...memberData
});

export const membersDataSchema = Joi.object({
  ...memberData,
  "group_id": Joi.string().uuid().required()
});

export const groupIdParamValidation = Joi.object({
  "group_id": Joi.string()
    .uuid()
    .required()
    .trim()
});
