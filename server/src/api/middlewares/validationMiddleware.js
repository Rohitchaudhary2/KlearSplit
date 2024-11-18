import {
  acceptRejectFriendRequestValidation,
  addExpenseValidation,
  archiveBlockFriendValidation,
  getFriendsValidation,
  paginationValidation,
  settleExpenseValidation,
  uuidParamValidation,
} from "../friends/friendValidations.js";
import {
  createUserSchema,
  emailSchema,
  restoreUserSchema,
  updateUserSchema,
} from "../users/userValidations.js";
import { ErrorHandler } from "./errorHandler.js";

// Middleware to validate user creation or update data
export const validateData = (req, res, next) => {
  try {
    const isUpdate = req.method === "PATCH"; // Check if the request is an update (PATCH)
    const schema = isUpdate ? updateUserSchema : createUserSchema;
    const { error, value } = schema.validate(req.body);
    if (error) throw new ErrorHandler(400, error);
    req.validatedUser = value;
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    next(error); // Pass the error to the error handler middleware
  }
};

// Middleware to validate email data
export const validateEmail = (req, res, next) => {
  try {
    const { error, value } = emailSchema.validate(req.body);
    if (error) throw new ErrorHandler(400, error);
    req.validatedUser = value;
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to validate restore user data
export const validateRestoreData = (req, res, next) => {
  try {
    const { error, value } = restoreUserSchema.validate(req.body);
    if (error) throw new ErrorHandler(400, error);
    req.validatedUser = value;
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to validate URL parameters
export const validateParams = (req, res, next) => {
  try {
    const { error, value } = uuidParamValidation.validate(req.params);
    if (error) throw new ErrorHandler(400, error);
    req.validatedParams = value;
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to validate pagination query parameters
export const validatePagination = (req, res, next) => {
  try {
    const { error, value } = paginationValidation.validate(req.query);
    if (error) throw new ErrorHandler(400, error);
    req.validatedPagination = value;
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to validate query parameters for retrieving friends
export const validateGetFriends = (req, res, next) => {
  try {
    const { error, value } = getFriendsValidation.validate(req.query);
    if (error) throw new ErrorHandler(400, error);
    req.validatedFriends = value;
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to validate friend request actions (accept/reject)
export const validateFriendRequest = (req, res, next) => {
  try {
    const { error, value } = acceptRejectFriendRequestValidation.validate(
      req.body,
    );
    if (error) throw new ErrorHandler(400, error);
    req.validatedFriend = value;
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to validate archive or block friend actions
export const validateArchiveBlockFriend = (req, res, next) => {
  try {
    const { error, value } = archiveBlockFriendValidation.validate(req.body);
    if (error) throw new ErrorHandler(400, error);
    req.validatedFriend = value;
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to validate expense-related data (add or settle expenses)
export const validateExpense = (req, res, next) => {
  try {
    const isSettlement = req.body.split_type === "SETTLEMENT";
    const schema = isSettlement
      ? settleExpenseValidation
      : addExpenseValidation;
    const { error, value } = schema.validate(req.body);
    if (error) throw new ErrorHandler(400, error);
    req.validatedExpense = value;
    next();
  } catch (error) {
    next(error);
  }
};
