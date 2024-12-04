import UserService from "./userServices.js";
import {
  authResponseHandler,
  responseHandler
} from "../utils/responseHandler.js";

class UserController {
  // Controller for verifying a user before user creation
  static verifyUser = async(req, res, next) => {
    try {
      await UserService.verifyUser(req.body);
      responseHandler(
        res,
        200,
        "If email is valid then OTP sent successfully."
      );
    } catch (error) {
      next(error);
    }
  };

  // Controller for creating or registering a user
  static createUser = async(req, res, next) => {
    try {
      const userData = await UserService.createUser(req.body);

      authResponseHandler(res, 201, "Successfully created user", userData);
    } catch (error) {
      next(error);
    }
  };

  // Controller for verifying a user before restore.
  static verifyRestoreUser = async(req, res, next) => {
    try {
      await UserService.verifyRestoreUser(req.body);
      responseHandler(res, 200, "Successfully Sent Otp");
    } catch (error) {
      next(error);
    }
  };

  // Controller for restoring user.
  static restoreUser = async(req, res, next) => {
    try {
      const userData = await UserService.restoreUser(req.body);

      authResponseHandler(res, 201, "Successfully restored user", userData);
    } catch (error) {
      next(error);
    }
  };

  // Controller for verifying email for forgot password.
  static verifyForgotPassword = async(req, res, next) => {
    try {
      await UserService.verifyForgotPassword(req.body);
      responseHandler(res, 200, "Successfully Sent Otp");
    } catch (error) {
      next(error);
    }
  };

  // Controller for changing password for forgot password.
  static forgotPassword = async(req, res, next) => {
    try {
      await UserService.forgotPassword(req.body);
      responseHandler(res, 200, "Successfully sent new Password.");
    } catch (error) {
      next(error);
    }
  };

  // Controller for getting user information
  static getUser = async(req, res, next) => {
    try {
      const userData = await UserService.getUser(req.user.user_id);

      responseHandler(res, 200, "Successfully fetched user", userData);
    } catch (error) {
      next(error);
    }
  };

  // Controller for getting users by a regular expression
  static getUsersByRegex = async(req, res, next) => {
    try {
      const { regex } = req.params;
      const { fetchAll } = req.query;
      const userId = req.user.user_id;

      const users = await UserService.getUsersByRegex({ "data": { regex, fetchAll }, userId });

      responseHandler(res, 200, "Successfully fetched users", users);
    } catch (error) {
      next(error);
    }
  };

  // Controller for updating the user
  static updateUser = async(req, res, next) => {
    try {
      const user = await UserService.updateUser(req);

      responseHandler(res, 200, "Successfully updated user", user);
    } catch (error) {
      next(error);
    }
  };

  // Controller for deleting the user
  static deleteUser = async(req, res, next) => {
    try {
      await UserService.deleteUser(req);
      responseHandler(res, 200, "Successfully deleted user");
    } catch (error) {
      next(error);
    }
  };
}

export default UserController;
