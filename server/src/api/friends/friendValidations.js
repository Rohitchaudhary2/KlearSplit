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
  page: Joi.number().integer().min(1).label("Page"),
  pageSize: Joi.number().integer().min(1).label("Page Size"),
  fetchAll: Joi.boolean().optional(),
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
    .trim()
    .valid("archived", "blocked")
    .required()
    .label("Type"),
});

// Validation for adding an expense
const addExpenseValidation = Joi.object({
  expense_name: Joi.string().trim().max(50).required().label("Expense Name"),
  total_amount: Joi.number()
    .positive()
    .max(9999999999.99)
    .required()
    .label("Total Amount"),
  description: Joi.string().trim().optional().label("Expense Description"),
  split_type: Joi.string()
    .trim()
    .valid("EQUAL", "UNEQUAL", "PERCENTAGE", "SETTLEMENT")
    .required()
    .label("Split Type"),
  payer_id: Joi.string().trim().uuid().required().label("Payer ID"),
  debtor_id: Joi.string().trim().uuid().required().label("Debtor ID"),
  friend_expense_id: Joi.string().trim().uuid().optional().label("Expense ID"),
  participant1_share: Joi.string().trim().optional().label("Participant Share"),
  participant2_share: Joi.string().trim().optional().label("Participant Share"),
  debtor_share: Joi.string().trim().optional().label("Debtor Share"),
});

// Validation for settlement of an expense
const settleExpenseValidation = Joi.object({
  total_amount: Joi.number().positive().required().label("Total Amount"),
  split_type: Joi.string()
    .trim()
    .valid("SETTLEMENT")
    .required()
    .label("Split Type"),
});

// Validation for expense update
const updateExpenseValidation = Joi.object({
  expense_name: Joi.string().trim().max(50).optional().label("Expense Name"),
  total_amount: Joi.number()
    .positive()
    .max(9999999999.99)
    .optional()
    .label("Total Amount"),
  description: Joi.string().trim().optional().label("Expense Description"),
  split_type: Joi.string()
    .trim()
    .valid("EQUAL", "UNEQUAL", "PERCENTAGE", "SETTLEMENT")
    .optional()
    .label("Split Type"),
  payer_id: Joi.string().trim().uuid().optional().label("Payer ID"),
  debtor_id: Joi.string().trim().uuid().optional().label("Debtor ID"),
  friend_expense_id: Joi.string().trim().uuid().optional().label("Expense ID"),
  participant1_share: Joi.string().trim().optional().label("Participant Share"),
  participant2_share: Joi.string().trim().optional().label("Participant Share"),
  debtor_share: Joi.string().trim().optional().label("Debtor Share"),
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
