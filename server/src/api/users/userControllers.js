import UserService from "./userServices.js";
import { authResponseHandler, responseHandler } from "../utils/responseHandler.js";
import asyncHandler from "./../utils/asyncHandler.js";

class UserController {
  // Controller for verifying a user before user creation
  static verifyUser = asyncHandler(async(req, res) => {
    await UserService.verifyUser(req.body);
    responseHandler(res, 200, "If email is valid then OTP sent successfully.");
  });

  // Controller for creating or registering a user
  static createUser = asyncHandler(async(req, res) => {
    const userData = await UserService.createUser(req.body);
  
    authResponseHandler(res, 201, "Successfully created user", userData);
  });

  // Controller for verifying a user before restore.
  static verifyRestoreUser = asyncHandler(async(req, res) => {
    await UserService.verifyRestoreUser(req.body);
    responseHandler(res, 200, "Successfully Sent Otp");
  });

  // Controller for restoring user.
  static restoreUser = asyncHandler(async(req, res) => {
    const userData = await UserService.restoreUser(req.body);

    authResponseHandler(res, 201, "Successfully restored user", userData);
  });

  // Controller for verifying email for forgot password.
  static verifyForgotPassword = asyncHandler(async(req, res) => {
    await UserService.verifyForgotPassword(req.body);
    responseHandler(res, 200, "Successfully Sent Otp");
  });

  // Controller for changing password for forgot password.
  static forgotPassword = asyncHandler(async(req, res) => {
    await UserService.forgotPassword(req.body);
    responseHandler(res, 200, "Successfully sent new Password.");
  });

  // Controller for getting user information
  static getUser = asyncHandler(async(req, res) => {
    const userData = await UserService.getUser(req.user.user_id);

    responseHandler(res, 200, "Successfully fetched user", userData);
  });

  // Controller for getting users by a regular expression
  static getUsersByRegex = asyncHandler(async(req, res) => {
    const { regex } = req.params;
    const { fetchAll } = req.query;
    const userId = req.user.user_id;
  
    const users = await UserService.getUsersByRegex({ "data": { regex, fetchAll }, userId });

    responseHandler(res, 200, "Successfully fetched users", users);
  });

  // Controller for updating the user
  static updateUser = asyncHandler(async(req, res) => {
    let updatedUserData = req.body;

    // If a file is uploaded, include the file path in the updated expense data
    if (req.file) {
      const imageUrl = `${req.protocol}://${req.get("host")}/uploads/profileImages/${req.file.filename}`;

      updatedUserData = Object.assign(updatedUserData, { "image_url": imageUrl });
    }
    const user = await UserService.updateUser(updatedUserData, req.user.user_id, req.user.email);

    responseHandler(res, 200, "Successfully updated user", user);
  });
  

  // Controller for deleting the user
  static deleteUser = asyncHandler(async(req, res) => {
    await UserService.deleteUser(req);
    responseHandler(res, 200, "Successfully deleted user");
  });
}

export default UserController;
