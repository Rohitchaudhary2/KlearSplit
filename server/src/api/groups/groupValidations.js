import Joi from "joi";

const memberData = {
  "membersData": {
    "members": Joi.array().items(Joi.string().uuid().required()).required(),
    "admins": Joi.array().items(Joi.string().uuid().required()),
    "coadmins": Joi.array().items(Joi.string().uuid().required())
  }
};

const optionalFieldsForGroup = {
  "group_description": Joi.string().trim()
};

export const groupCreationSchema = Joi.object({
  "group": {
    "group_name": Joi.string().trim().min(2).max(50).required().messages({
      "string.max": "Group name must be between 2 to 50 characters.",
      "any.required": "Group name is required."
    }),
    ...optionalFieldsForGroup
  },
  ...memberData
});

export const groupUpdationSchema = Joi.object({
  "group_name": Joi.string().trim().min(2).max(50).messages({
    "string.max": "Group name must be between 2 to 50 characters.",
    "any.required": "Group name is required."
  }),
  ...optionalFieldsForGroup
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

export const updateGroupMemberSchema = Joi.object({
  "status": Joi.string().valid("PENDING", "ACCEPTED", "REJECTED").optional(),
  "has_archived": Joi.boolean().optional()
});

export const saveMessageSchema = Joi.object({
  "message": Joi.string().trim().max(512).required()
});

const debtorSchema = Joi.object({
  "debtor_id": Joi.string().required(),
  "debtor_share": Joi.number().positive().max(9999999999.98).required()
});

export const expenseCreationSchema = Joi.object({
  "expense_name": Joi.string().trim().max(50).required(),
  "payer_id": Joi.string().trim().uuid().required(),
  "total_amount": Joi.number().positive().max(9999999999.99).required(),
  "description": Joi.string().trim().min(1),
  "split_type": Joi.string().trim().valid("EQUAL", "UNEQUAL", "PERCENTAGE").required(),
  "payer_share": Joi.number().positive().max(9999999999.98).required(),
  "debtors": Joi.array().items(debtorSchema).min(1)
});