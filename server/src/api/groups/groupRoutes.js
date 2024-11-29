import { Router } from "express";
import GroupController from "./groupController.js";
// import uploadMiddleware from "../middlewares/uploadMiddleware.js";
import { validateGroupCreationData, validateGroupParams, validateGroupUpdationData, validateMembersData, validateUpdateGroupMember } from "../middlewares/validationMiddleware.js";
import { authenticateToken } from "../middlewares/auth.js";
import uploadMiddleware from "../middlewares/uploadMiddleware.js";

const groupRouter = Router();

groupRouter.post("/create", authenticateToken, uploadMiddleware("groupProfile", "image"), validateGroupCreationData, GroupController.createGroup);

groupRouter.post("/addmembers", authenticateToken, validateMembersData, GroupController.addMembers);

groupRouter.get("/usergroups", authenticateToken, GroupController.getUserGroups);

groupRouter.get("/:group_id", authenticateToken, validateGroupParams, GroupController.getGroup);

groupRouter.patch("/:group_id", authenticateToken, validateGroupParams, validateGroupUpdationData, GroupController.updateGroup);

groupRouter.patch("/:group_id", authenticateToken, validateGroupParams, validateUpdateGroupMember, GroupController.updateGroupMember);
export default groupRouter;
