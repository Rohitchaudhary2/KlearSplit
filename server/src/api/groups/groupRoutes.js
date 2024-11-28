import { Router } from "express";
import GroupController from "./groupController.js";
// import uploadMiddleware from "../middlewares/uploadMiddleware.js";
import { validateGroupCreationData, validateMembersData } from "../middlewares/validationMiddleware.js";
import { authenticateToken } from "../middlewares/auth.js";

const groupRouter = Router();

groupRouter.post("/create", authenticateToken, validateGroupCreationData, GroupController.createGroup);

groupRouter.post("/addmembers", authenticateToken, validateMembersData, GroupController.addMembers);

groupRouter.get("/usergroups", authenticateToken, GroupController.getUserGroups);
export default groupRouter;
