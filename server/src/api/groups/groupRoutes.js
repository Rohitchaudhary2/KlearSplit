import { Router } from "express";
import GroupController from "./groupController.js";
// import uploadMiddleware from "../middlewares/uploadMiddleware.js";
import { validateExpenseData, validateGroupCreationData, validateGroupParams, validateGroupUpdationData, validateMembersData, validateMessageData, validateUpdateGroupMember } from "../middlewares/validationMiddleware.js";
import { authenticateToken } from "../middlewares/auth.js";

const groupRouter = Router();

// Route for creating group
groupRouter.post("/create", authenticateToken, validateGroupCreationData, GroupController.createGroup);

// Route for adding members in group
groupRouter.post("/addmembers", authenticateToken, validateMembersData, GroupController.addMembers);

// Route for fetching user specific groups
groupRouter.get("/usergroups", authenticateToken, GroupController.getUserGroups);

// Routes for getting group members with group specific detials
groupRouter.get("/:group_id", authenticateToken, validateGroupParams, GroupController.getGroup);

// Route for updating group data
groupRouter.patch("/:group_id", authenticateToken, validateGroupParams, validateGroupUpdationData, GroupController.updateGroup);

// Route for updating member information
groupRouter.patch("/updatemember/:group_id", authenticateToken, validateGroupParams, validateUpdateGroupMember, GroupController.updateGroupMember);

// Route for saving message
groupRouter.post("/savemessage/:group_id", authenticateToken, validateGroupParams, validateMessageData, GroupController.saveMessage);

// Route for retrieving messages
groupRouter.get("/getmessages/:group_id", authenticateToken, validateGroupParams, GroupController.getMessages);

// Route for leaving group
groupRouter.delete("/leavegroup/:group_id", authenticateToken, validateGroupParams, GroupController.leaveGroup);

// Route for adding expense in the group
groupRouter.post("/addexpense/:group_id", authenticateToken, validateGroupParams, validateExpenseData, GroupController.addExpense);

// Route for fetching expenses for a particular group
groupRouter.get("/getexpense/:group_id", authenticateToken, validateGroupParams, GroupController.getExpenses);
export default groupRouter;
