import { Router } from "express";
import DashboardController from "./dashboardController.js";
import { authenticateToken } from "../middlewares/auth.js";
import { validateBody } from "./../middlewares/validationMiddleware.js";
import { year } from "./dashboardValidations.js";

const dashboardRouter = Router();

dashboardRouter.get("/expensescount", authenticateToken, DashboardController.getExpensesCount);

dashboardRouter.get("/balance", authenticateToken, DashboardController.getBalance);

dashboardRouter.get("/cashflowfriends", authenticateToken, DashboardController.topCashFlowFriends);

dashboardRouter.get("/cashflowgroups", authenticateToken, DashboardController.topcashflowGroups);

dashboardRouter.post("/monthlyexpenses", authenticateToken, validateBody(year), DashboardController.getMonthlyExpenses);

export default dashboardRouter;
