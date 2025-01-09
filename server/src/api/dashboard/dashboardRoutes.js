import { Router } from "express";
import DashboardController from "./dashboardController.js";
import { authenticateToken } from "../middlewares/auth.js";
import { validateBody } from "./../middlewares/validationMiddleware.js";
import { year } from "./dashboardValidations.js";

const dashboardRouter = Router();

// Retrieves stats for expenses required to be displayed on dashboard
dashboardRouter.get(
  "/getallexpensesdata",
  authenticateToken,
  DashboardController.getAllExpensesData
);

dashboardRouter.get("/expensescount", authenticateToken, DashboardController.getExpensesCount);

dashboardRouter.get("/balance", authenticateToken, DashboardController.getBalance);

dashboardRouter.get("/cashflowfriends", authenticateToken, DashboardController.topCashFlowFriends);

dashboardRouter.get("/topcashflowgroups", authenticateToken, DashboardController.topcashflowGroups);

dashboardRouter.post("/monthlyexpenses", authenticateToken, validateBody(year), DashboardController.getMonthlyExpenses);

export default dashboardRouter;
