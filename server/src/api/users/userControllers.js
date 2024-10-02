import UserService from "./userServices.js";
import {
  authResponseHandler,
  responseHandler,
} from "../utils/responseHandler.js";

// Controller for verifying a user
export const verifyUserContoller = async (req, res, next) => {
  try {
    await UserService.verifyUser(req.validatedUser);
    responseHandler(res, 200, "Successfully Sent Otp");
  } catch (error) {
    next(error);
  }
};

// Controller for creating or registering a user
export const createUserController = async (req, res, next) => {
  try {
    const userData = await UserService.createUser(req.validatedUser);
    authResponseHandler(res, 201, "Successfully created user", userData);
  } catch (error) {
    next(error);
  }
};

// Controller for verifying a user
export const verifyRestoreUserContoller = async (req, res, next) => {
  try {
    await UserService.verifyRestoreUser(req.validatedUser);
    responseHandler(res, 200, "Successfully Sent Otp");
  } catch (error) {
    next(error);
  }
};

// Controller for creating or registering a user
export const restoreUserController = async (req, res, next) => {
  try {
    const userData = await UserService.restoreUser(req.validatedUser);
    authResponseHandler(res, 201, "Successfully restored user", userData);
  } catch (error) {
    next(error);
  }
};

export const verifyForgotPasswordController = async (req, res, next) => {
  try {
    await UserService.verifyForgotPasswordUser(req.validatedUser);
    responseHandler(res, 200, "Successfully Sent Otp");
  } catch (error) {
    next(error);
  }
};

export const forgotPasswordController = async (req, res, next) => {
  try {
    await UserService.forgotPassword(req.validatedUser.email);
    responseHandler(res, 200, "Successfully sent new Password.");
  } catch (error) {
    next(error);
  }
};

// Controller for getting user information
export const getUserController = async (req, res, next) => {
  try {
    const userData = await UserService.getUser(req.params.id);
    responseHandler(res, 200, "Successfully fetched user", userData);
  } catch (error) {
    next(error);
  }
};

// Controller for updating the user
export const updateUserController = async (req, res, next) => {
  try {
    const user = await UserService.updateUser(req);
    responseHandler(res, 200, "Successfully updated user", user);
  } catch (error) {
    next(error);
  }
};

// Controller for deleting the user
export const deleteUserController = async (req, res, next) => {
  try {
    await UserService.deleteUser(req);
    responseHandler(res, 200, "Successfully deleted user");
  } catch (error) {
    next(error);
  }
};
