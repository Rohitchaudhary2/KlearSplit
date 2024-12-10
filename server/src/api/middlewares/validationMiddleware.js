import {
  addExpenseValidation,
  settleExpenseValidation
} from "../friends/friendValidations.js";
import { ErrorHandler } from "./errorHandler.js";
import { expenseCreationSchema, groupCreationSchema, groupUpdationSchema } from "./../groups/groupValidations.js";

const validateData = (schema, data) => {
  const { error, value } = schema.validate(data);

  if (error) {
    throw new ErrorHandler(400, error);
  }
  return value;
};


export const validateBody = (schema) => (req, res, next) => {
  try {
    req.body = validateData(schema, req.body);
    next();
  } catch (error) {
    next(error);
  }
};

export const validateParams = (schema) => (req, res, next) => {
  try {
    req.params = validateData(schema, req.params);
    next();
  } catch (error) {
    next(error);
  }
};

export const validateQuery = (schema) => (req, res, next) => {
  try {
    req.query = validateData(schema, req.query);
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to validate expense-related data (add or settle expenses)
export const validateExpense = (req, res, next) => {
  try {
    const isSettlement = req.body.split_type === "SETTLEMENT";
    const schema = isSettlement ? settleExpenseValidation : addExpenseValidation;

    req.body = validateData(schema, req.body);
    next();
  } catch (error) {
    next(error);
  }
};

export const validateGroupCreationData = (req, res, next) => {
  try {
    const group = JSON.parse(req.body.group);
    const membersData = JSON.parse(req.body.membersData);
    const { error, value } = groupCreationSchema.validate({ group, membersData });
    
    if (error) {
      throw new ErrorHandler(400, error);
    }
    req.body = value;
    next();
  } catch (error) {
    next(error);
  }
};

export const validateGroupUpdationData = (req, res, next) => {
  try {
    const { error, value } = groupUpdationSchema.validate(req.body);

    if (error) {
      throw new ErrorHandler(400, error);
    }
    req.body = value;
    next();
  } catch (error) {
    next(error);
  }
};

export const validateGroupExpense = (req, res, next) => {
  try {
    const debtors = JSON.parse(req.body.debtors);

    const { error, value } = expenseCreationSchema.validate({ ...req.body, debtors });

    if (error) {
      throw new ErrorHandler(400, error);
    }
    req.body = value;
    next();
  } catch (error) {
    next(error);
  }
};
