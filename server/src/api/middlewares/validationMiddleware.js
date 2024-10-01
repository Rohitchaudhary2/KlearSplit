import {
  createUserSchema,
  restoreUserSchema,
  updateUserSchema,
} from "../users/userValidations.js";
import { ErrorHandler } from "./errorHandler.js";

export const validateData = (req, res, next) => {
  try {
    const isUpdate = req.method === "PATCH";
    const schema = isUpdate ? updateUserSchema : createUserSchema;
    const { error, value } = schema.validate(req.body);
    if (error) throw next(new ErrorHandler(400, error));
    req.validatedUser = value;
    next();
  } catch (error) {
    next(error);
  }
};

export const validateRestoreData = (req, res, next) => {
  try {
    const { error, value } = restoreUserSchema.validate(req.body);
    if (error) throw next(new ErrorHandler(400, error));
    req.validatedUser = value;
    next();
  } catch (error) {
    next(error);
  }
};
