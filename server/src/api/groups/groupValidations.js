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
      "string.min": "Group name must be at least 2 characters long.",
      "string.max": "Group name must be between 2 to 50 characters.",
      "any.required": "Group name is required."
    }),
    ...optionalFieldsForGroup
  },
  ...memberData
});

export const groupUpdationSchema = Joi.object({
  "group_name": Joi.string().trim().min(2).max(50).messages({
    "string.min": "Group name must be at least 2 characters long.",
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
  "group_id": Joi.string().uuid().required()
});

export const updateGroupMemberSchema = Joi.object({
  "status": Joi.string().valid("PENDING", "ACCEPTED", "REJECTED").optional(),
  "has_archived": Joi.boolean().optional(),
  "has_blocked": Joi.boolean().optional()
});

export const saveMessageSchema = Joi.object({
  "message": Joi.string().trim().max(512).required()
});

const debtorSchema = Joi.object({
  "debtor_id": Joi.string().required(),
  "debtor_share": Joi.number().positive().max(9999999999.98).required()
});

const expenseId = {
  "group_expense_id": Joi.string().uuid()
};

export const expenseCreationSchema = Joi.object({
  "expense_name": Joi.string().trim().max(50).required(),
  "payer_id": Joi.string().trim().uuid().required(),
  "total_amount": Joi.number().positive().max(9999999999.99).required(),
  "description": Joi.string().trim().min(1),
  "split_type": Joi.string().trim().valid("EQUAL", "UNEQUAL", "PERCENTAGE").required(),
  "payer_share": Joi.number().min(0).max(9999999999.98).required(),
  "debtors": Joi.array().items(debtorSchema).min(1),
  ...expenseId
});

export const groupExpenseId = Joi.object({
  "group_expense_id": expenseId.group_expense_id.required()
});

const settementId = {
  "group_settlement_id": Joi.string().trim().uuid().required()
};

export const settlementCreationSchema = Joi.object({
  "payer_id": Joi.string().trim().uuid().required(),
  "debtor_id": Joi.string().trim().uuid().required(),
  "settlement_amount": Joi.number().positive().max(9999999999.99).required(),
  "description": Joi.string().trim().min(1)
});

export const settlementUpdation = Joi.object({
  ...settementId,
  "settlement_amount": Joi.number().positive().max(9999999999.99).required(),
  "description": Joi.string().trim().min(1)
});

export const groupSettlementId = Joi.object(settementId);
