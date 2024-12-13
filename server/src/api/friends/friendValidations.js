import Joi from "joi";

// Validation schema for UUID in the parameters
// Ensures the `id` is a valid UUID and is required
const uuidParamValidation = Joi.object({
  "conversation_id": Joi.string()
    .uuid()
    .required()
    .trim()
    .label("Conversation ID")
});

// Validation schema for pagination query parameters
// Includes optional `page`, `pageSize`, and `fetchAll` fields
const paginationValidation = Joi.object({
  "page": Joi.number().integer().min(1).label("Page"), // Ensures `page` is a positive integer
  "pageSize": Joi.number().integer().min(1).label("Page Size"), // Ensures `pageSize` is a positive integer
  "offset": Joi.number().min(0).max(2).optional(),
  "timestamp": Joi.date(),
  "fetchAll": Joi.boolean().optional() // Optional boolean to fetch all results
});

// Validation schema for filtering friends in the getAllFriends API
// Validates `status`, `archival_status`, and `block_status` fields
const getFriendsValidation = Joi.object({
  "status": Joi.string()
    .valid("PENDING", "ACCEPTED", "REJECTED")
    .optional()
    .trim()
    .label("Status"), // Ensures the status is one of the defined valid values
  "archival_status": Joi.string()
    .valid("NONE", "FRIEND1", "FRIEND2", "BOTH")
    .optional()
    .trim()
    .label("Archival Status"), // Ensures archival status matches valid options
  "block_status": Joi.string()
    .valid("NONE", "FRIEND1", "FRIEND2", "BOTH")
    .optional()
    .trim()
    .label("Block Status") // Ensures block status matches valid options
});

// Validation schema for accepting or rejecting a friend request
// Ensures `status` is one of the valid values and required
const acceptRejectFriendRequestValidation = Joi.object({
  "status": Joi.string()
    .valid("PENDING", "ACCEPTED", "REJECTED")
    .required()
    .trim()
    .label("Status")
});

// Validation schema for blocking or archiving a friend
// Ensures `type` is either "archived" or "blocked"
const archiveBlockFriendValidation = Joi.object({
  "type": Joi.string()
    .trim()
    .valid("archived", "blocked")
    .required()
    .label("Type")
});

// Validation for adding an expense
const addExpenseValidation = Joi.object({
  "expense_name": Joi.string().trim().max(50).required().label("Expense Name"), // Ensures the expense name is within 50 characters and required
  "total_amount": Joi.number()
    .positive()
    .max(9999999999.99)
    .required()
    .label("Total Amount"), // Ensures total amount is positive and within a realistic range
  "description": Joi.string().trim().optional().label("Expense Description"), // Optional description field
  "split_type": Joi.string()
    .trim()
    .valid("EQUAL", "UNEQUAL", "PERCENTAGE", "SETTLEMENT")
    .required()
    .label("Split Type"), // Ensures split type is one of the valid options
  "payer_id": Joi.string().trim().uuid().required().label("Payer ID"), // Ensures payer ID is a valid UUID and required
  "debtor_id": Joi.string().trim().uuid().required().label("Debtor ID"), // Ensures debtor ID is a valid UUID and required
  "friend_expense_id": Joi.string().trim().uuid().optional().label("Expense ID"), // Optional expense ID field
  "participant1_share": Joi.string().trim().optional().label("Participant Share"), // Optional participant share field
  "participant2_share": Joi.string().trim().optional().label("Participant Share"), // Optional participant share field
  "debtor_share": Joi.string().trim().optional().label("Debtor Share") // Optional debtor share field
});

// Validation schema for settling an expense
// Ensures `total_amount` and `split_type` are valid and required
const settleExpenseValidation = Joi.object({
  "total_amount": Joi.number().positive().required().label("Total Amount"), // Ensures total amount is positive and required
  "split_type": Joi.string()
    .trim()
    .valid("SETTLEMENT")
    .required()
    .label("Split Type") // Ensures split type is "SETTLEMENT" and required
});

// Exporting all validations
export {
  uuidParamValidation,
  paginationValidation,
  getFriendsValidation,
  acceptRejectFriendRequestValidation,
  archiveBlockFriendValidation,
  addExpenseValidation,
  settleExpenseValidation
};
