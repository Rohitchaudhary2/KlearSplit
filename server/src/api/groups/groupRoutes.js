import { Router } from "express";
import GroupController from "./groupController.js";
import uploadMiddleware from "../middlewares/uploadMiddleware.js";

const groupRouter = Router();

groupRouter.post("/create", uploadMiddleware, GroupController.createGroup);

export default groupRouter;
