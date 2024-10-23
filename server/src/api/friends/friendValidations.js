import Joi from "joi";

// Validation for UUID in the params
const uuidParamValidation = Joi.object({
  conversation_id: Joi.string()
    .uuid()
    .required()
    .trim()
    .label("Conversation ID"),
});

// Validation for the query parameters in getAllFriends
const paginationValidation = Joi.object({
  page: Joi.number().integer().min(1).default(1).label("Page"),
  pageSize: Joi.number().integer().min(1).default(10).label("Page Size"),
});

// Validation for getFriends
const getFriendsValidation = Joi.object({
  status: Joi.string()
    .valid("PENDING", "ACCEPTED", "REJECTED")
    .optional()
    .trim()
    .label("Status"),
  archival_status: Joi.string()
    .valid("NONE", "FRIEND1", "FRIEND2", "BOTH")
    .optional()
    .trim()
    .label("Archival Status"),
  block_status: Joi.string()
    .valid("NONE", "FRIEND1", "FRIEND2", "BOTH")
    .optional()
    .trim()
    .label("Block Status"),
});

// Validation for accepting or rejecting a friend request
const acceptRejectFriendRequestValidation = Joi.object({
  status: Joi.string()
    .valid("PENDING", "ACCEPTED", "REJECTED")
    .required()
    .trim()
    .label("Status"),
});

// Validation for blocking or archiving a friend
const archiveBlockFriendValidation = Joi.object({
  type: Joi.string()
    .valid("archived", "blocked")
    .required()
    .trim()
    .label("Type"),
});

// Validation for adding an expense
const addExpenseValidation = Joi.object({
  expense_name: Joi.string()
    .min(1)
    .max(50)
    .required()
    .trim()
    .label("Expense Name"),
  total_amount: Joi.number()
    .positive()
    .max(100000000)
    .required()
    .label("Total Amount"),
  description: Joi.string().optional().trim().label("Expense Description"),
  split_type: Joi.string()
    .valid("EQUAL", "UNEQUAL", "PERCENTAGE", "SETTLEMENT")
    .required()
    .trim()
    .label("Split Type"),
  payer_id: Joi.string().uuid().required().trim().label("Payer ID"),
  debtor_id: Joi.string().uuid().required().trim().label("Debtor ID"),
  friend_expense_id: Joi.string().uuid().optional().trim().label("Expense ID"),
  participant1_share: Joi.string().optional().trim().label("Participant Share"),
  participant2_share: Joi.string().optional().trim().label("Participant Share"),
  debtor_share: Joi.string().optional().trim().label("Debtor Share"),
});

// Validation for settlement of an expense
const settleExpenseValidation = Joi.object({
  total_amount: Joi.number().positive().required().label("Total Amount"),
  split_type: Joi.string()
    .valid("SETTLEMENT")
    .required()
    .trim()
    .label("Split Type"),
});

// Validation for expense update
const updateExpenseValidation = Joi.object({
  expense_name: Joi.string()
    .min(1)
    .max(50)
    .optional()
    .trim()
    .label("Expense Name"),
  total_amount: Joi.number()
    .positive()
    .max(100000000)
    .optional()
    .label("Total Amount"),
  description: Joi.string().optional().trim().label("Expense Description"),
  split_type: Joi.string()
    .valid("EQUAL", "UNEQUAL", "PERCENTAGE", "SETTLEMENT")
    .optional()
    .trim()
    .label("Split Type"),
  payer_id: Joi.string().uuid().optional().trim().label("Payer ID"),
  debtor_id: Joi.string().uuid().optional().trim().label("Debtor ID"),
  friend_expense_id: Joi.string().uuid().optional().trim().label("Expense ID"),
  participant1_share: Joi.string().optional().trim().label("Participant Share"),
  participant2_share: Joi.string().optional().trim().label("Participant Share"),
  debtor_share: Joi.string().optional().trim().label("Debtor Share"),
});

// Exporting all validations
export {
  uuidParamValidation,
  paginationValidation,
  getFriendsValidation,
  acceptRejectFriendRequestValidation,
  archiveBlockFriendValidation,
  addExpenseValidation,
  settleExpenseValidation,
  updateExpenseValidation,
};
