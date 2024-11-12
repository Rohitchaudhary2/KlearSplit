import {
  acceptRejectFriendRequestValidation,
  addExpenseValidation,
  archiveBlockFriendValidation,
  getFriendsValidation,
  paginationValidation,
  settleExpenseValidation,
  updateExpenseValidation,
  uuidParamValidation,
} from "../friends/friendValidations.js";
import {
  createUserSchema,
  emailSchema,
  restoreUserSchema,
  updateUserSchema,
} from "../users/userValidations.js";
import { ErrorHandler } from "./errorHandler.js";

export const validateData = (req, res, next) => {
  try {
    const isUpdate = req.method === "PATCH";
    const schema = isUpdate ? updateUserSchema : createUserSchema;
    const { error, value } = schema.validate(req.body);
    if (error) throw new ErrorHandler(400, error);
    req.validatedUser = value;
    next();
  } catch (error) {
    next(error);
  }
};

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

export const validateExpense = (req, res, next) => {
  try {
    const isUpdate = req.method === "PATCH";
    const isSettlement = req.body.split_type === "SETTLEMENT";
    const schema = isUpdate
      ? updateExpenseValidation
      : isSettlement
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
