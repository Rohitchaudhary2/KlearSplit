import UserService from "./userServices.js";
import { ResponseHandler } from "../utils/ResponseHandler.js";

// Controller for creating or registering a user
export const createUserController = async (req, res, next) => {
  try {
    const userData = await UserService.createUserService(req.body, next);
    res
      .status(201)
      .set("Authorization", `Bearer ${userData.accessToken}`)
      .cookie("refreshToken", userData.refreshToken, {
        httpOnly: true,
        sameSite: "strict",
      })
      .json(ResponseHandler("Successfully created user", userData.user));
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// Controller for getting user information
export const getUserController = async (req, res, next) => {
  try {
    const userData = await UserService.getUserService(req.params.id, next);
    res
      .status(200)
      .json(ResponseHandler("Successfully fetched user", userData));
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// Controller for updating the user
export const updateUserController = async (req, res, next) => {
  try {
    const user = await UserService.updateUserService(req, next);
    res.status(200).json(ResponseHandler("Successfully updated user", user));
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// Controller for deleting the user
export const deleteUserController = async (req, res, next) => {
  try {
    await UserService.deleteUserService(req, next);
    res.status(200).json(ResponseHandler("Successfully deleted user"));
  } catch (error) {
    console.log(error);
    next(error);
  }
};
