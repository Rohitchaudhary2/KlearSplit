import { Router } from "express";
import GroupController from "./groupController.js";
// import uploadMiddleware from "../middlewares/uploadMiddleware.js";
import { validateGroupCreationData } from "../middlewares/validationMiddleware.js";
import { authenticateToken } from "../middlewares/auth.js";

const groupRouter = Router();

groupRouter.post("/create", authenticateToken, validateGroupCreationData, GroupController.createGroup);

export default groupRouter;
