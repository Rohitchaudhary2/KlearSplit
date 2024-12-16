import { Router } from "express";
import GroupController from "./groupController.js";
import { validateBody, validateGroupCreationData, validateGroupExpense, validateGroupUpdationData, validateParams, validateQuery } from "../middlewares/validationMiddleware.js";
import * as groupSchema from "./groupValidations.js";
import { authenticateToken } from "../middlewares/auth.js";
import uploadMiddleware from "../middlewares/uploadMiddleware.js";
import { paginationValidation } from "../friends/friendValidations.js";

const groupRouter = Router();

groupRouter.post("/create", authenticateToken, uploadMiddleware("groupProfile", "image"), validateGroupCreationData, GroupController.createGroup);

// Route for adding members in group
groupRouter.post("/addmembers", authenticateToken, validateBody(groupSchema.membersDataSchema), GroupController.addMembers);

// Route for fetching user specific groups
groupRouter.get("/usergroups", authenticateToken, GroupController.getUserGroups);

// Routes for getting group members with group specific detials
groupRouter.get("/:group_id", authenticateToken, validateParams(groupSchema.groupIdParamValidation), GroupController.getGroup);

// Route for updating group data
groupRouter.patch("/:group_id", authenticateToken, uploadMiddleware("groupProfile", "image"), validateParams(groupSchema.groupIdParamValidation), validateGroupUpdationData, GroupController.updateGroup);

// Route for updating member information
groupRouter.patch("/updatemember/:group_id", authenticateToken, validateParams(groupSchema.groupIdParamValidation), validateBody(groupSchema.updateGroupMemberSchema), GroupController.updateGroupMember);

// Route for saving message
groupRouter.post("/savemessage/:group_id", authenticateToken, validateParams(groupSchema.groupIdParamValidation), validateBody(groupSchema.saveMessageSchema), GroupController.saveMessage);

// Route for retrieving messages
groupRouter.get("/getmessages/:group_id", authenticateToken, validateParams(groupSchema.groupIdParamValidation), validateQuery(paginationValidation), GroupController.getMessages);

// Route for leaving group
groupRouter.delete("/leavegroup/:group_id", authenticateToken, validateParams(groupSchema.groupIdParamValidation), GroupController.leaveGroup);

// Route for adding expense in the group
groupRouter.post("/addexpense/:group_id", authenticateToken, uploadMiddleware("groupExpenses", "receipt"), validateParams(groupSchema.groupIdParamValidation), validateGroupExpense, GroupController.addExpense);

// Route for adding settlement in the group
groupRouter.post("/addsettlement/:group_id", authenticateToken, validateParams(groupSchema.groupIdParamValidation), validateBody(groupSchema.settlementCreationSchema), GroupController.addSettlement);

// Route for fetching expenses for a particular group
groupRouter.get("/expensessettlements/:group_id", authenticateToken, validateParams(groupSchema.groupIdParamValidation), validateQuery(paginationValidation), GroupController.getExpensesSettlements);

groupRouter.get("/messagesexpensessettlements/:group_id", authenticateToken, validateParams(groupSchema.groupIdParamValidation), validateQuery(paginationValidation), GroupController.getMessagesExpensesSettlements);

groupRouter.patch("/updateexpense/:group_id", authenticateToken, uploadMiddleware("groupExpenses", "receipt"), validateParams(groupSchema.groupIdParamValidation), validateGroupExpense, GroupController.updateExpense);

groupRouter.patch("/updatesettlement/:group_id", authenticateToken, validateParams(groupSchema.groupIdParamValidation), validateBody(groupSchema.settlementUpdation), GroupController.updateSettlement);

groupRouter.delete("/deleteexpense/:group_id", authenticateToken, validateParams(groupSchema.groupIdParamValidation), validateBody(groupSchema.groupExpenseId), GroupController.deleteExpense);

groupRouter.delete("/deletesettlement/:group_id", authenticateToken, validateParams(groupSchema.groupIdParamValidation), validateBody(groupSchema.groupSettlementId), GroupController.deleteSettlement);

export default groupRouter;
