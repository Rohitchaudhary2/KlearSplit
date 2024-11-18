import { Router } from "express";
import DashboardController from "./dashboardController.js";
import { authenticateToken } from "../middlewares/auth.js";

const dashboardRouter = Router();

// Retrieves stats for expenses required to be displayed on dashboard
dashboardRouter.get(
  "/getallexpensesdata",
  authenticateToken,
  DashboardController.getAllExpensesData,
);

export default dashboardRouter;
