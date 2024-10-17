import UserService from "./userServices.js";
import {
  authResponseHandler,
  responseHandler,
} from "../utils/responseHandler.js";

class UserController {
  // Controller for verifying a user
  static verifyUser = async (req, res, next) => {
    try {
      await UserService.verifyUser(req.validatedUser);
      responseHandler(res, 200, "Successfully Sent Otp");
    } catch (error) {
      next(error);
    }
  };

  // Controller for creating or registering a user
  static createUser = async (req, res, next) => {
    try {
      const userData = await UserService.createUser(req.validatedUser);
      authResponseHandler(res, 201, "Successfully created user", userData);
    } catch (error) {
      next(error);
    }
  };

  // Controller for verifying a user
  static verifyRestoreUser = async (req, res, next) => {
    try {
      await UserService.verifyRestoreUser(req.validatedUser);
      responseHandler(res, 200, "Successfully Sent Otp");
    } catch (error) {
      next(error);
    }
  };

  // Controller for creating or registering a user
  static restoreUser = async (req, res, next) => {
    try {
      const userData = await UserService.restoreUser(req.validatedUser);
      authResponseHandler(res, 201, "Successfully restored user", userData);
    } catch (error) {
      next(error);
    }
  };

  static verifyForgotPassword = async (req, res, next) => {
    try {
      await UserService.verifyForgotPassword(req.validatedUser);
      responseHandler(res, 200, "Successfully Sent Otp");
    } catch (error) {
      next(error);
    }
  };

  static forgotPassword = async (req, res, next) => {
    try {
      await UserService.forgotPassword(req.validatedUser);
      responseHandler(res, 200, "Successfully sent new Password.");
    } catch (error) {
      next(error);
    }
  };

  // Controller for getting user information
  static getUser = async (req, res, next) => {
    try {
      const userData = await UserService.getUser(req.params.id);
      responseHandler(res, 200, "Successfully fetched user", userData);
    } catch (error) {
      next(error);
    }
  };

  // Controller for getting users by a regular expression
  static getUsersByRegex = async (req, res, next) => {
    try {
      const regex = req.params.regex;
      const { user_id } = req.user;

      const users = await UserService.getUsersByRegex({ regex, user_id });
      responseHandler(res, 200, "Successfully fetched users", users);
    } catch (error) {
      next(error);
    }
  };

  // Controller for updating the user
  static updateUser = async (req, res, next) => {
    try {
      const user = await UserService.updateUser(req);
      responseHandler(res, 200, "Successfully updated user", user);
    } catch (error) {
      next(error);
    }
  };

  // Controller for deleting the user
  static deleteUser = async (req, res, next) => {
    try {
      await UserService.deleteUser(req);
      responseHandler(res, 200, "Successfully deleted user");
    } catch (error) {
      next(error);
    }
  };
}

export default UserController;
