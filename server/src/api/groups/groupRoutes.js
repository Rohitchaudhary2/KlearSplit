import { Router } from "express";
import GroupController from "./groupController.js";
// import uploadMiddleware from "../middlewares/uploadMiddleware.js";
import { validateGroupCreationData, validateGroupParams, validateMembersData } from "../middlewares/validationMiddleware.js";
import { authenticateToken } from "../middlewares/auth.js";

const groupRouter = Router();

groupRouter.post("/create", authenticateToken, validateGroupCreationData, GroupController.createGroup);

groupRouter.post("/addmembers", authenticateToken, validateMembersData, GroupController.addMembers);

groupRouter.get("/usergroups", authenticateToken, GroupController.getUserGroups);

groupRouter.get("/:group_id", authenticateToken, validateGroupParams, GroupController.getGroup);
export default groupRouter;
