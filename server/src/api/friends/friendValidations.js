import Joi from "joi";

// Validation for UUID in the params
const uuidParamValidation = Joi.object({
  conversation_id: Joi.string().uuid().required().label("Conversation ID"),
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
    .label("Status"),
  archival_status: Joi.string()
    .valid("NONE", "FRIEND1", "FRIEND2", "BOTH")
    .optional()
    .label("Archival Status"),
  block_status: Joi.string()
    .valid("NONE", "FRIEND1", "FRIEND2", "BOTH")
    .optional()
    .label("Block Status"),
});

// Validation for accepting or rejecting a friend request
const acceptRejectFriendRequestValidation = Joi.object({
  status: Joi.string()
    .valid("PENDING", "ACCEPTED", "REJECTED")
    .required()
    .label("Status"),
});

// Validation for blocking or archiving a friend
const archiveBlockFriendValidation = Joi.object({
  type: Joi.string().valid("archived", "blocked").required().label("Type"),
});

// Validation for adding an expense
const addExpenseValidation = Joi.object({
  expense_name: Joi.string().required().label("Expense Name"),
  total_amount: Joi.number().positive().required().label("Total Amount"),
  description: Joi.string().optional().label("Expense Description"),
  split_type: Joi.string()
    .valid("EQUAL", "UNEQUAL", "PERCENTAGE", "SETTLEMENT")
    .required()
    .label("Split Type"),
  payer_id: Joi.string().uuid().required().label("Payer ID"),
  debtor_id: Joi.string().uuid().required().label("Debtor ID"),
  participant1_share: Joi.string().optional().label("Participant Share"),
  participant2_share: Joi.string().optional().label("Participant Share"),
  debtor_share: Joi.string().optional().label("Debtor Share"),
});

// Validation for settlement of an expense
const settleExpenseValidation = Joi.object({
  total_amount: Joi.number().positive().required().label("Total Amount"),
  split_type: Joi.string().valid("SETTLEMENT").required().label("Split Type"),
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
};
