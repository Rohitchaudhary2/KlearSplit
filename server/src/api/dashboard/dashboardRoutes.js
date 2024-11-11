import { Router } from "express";
import DashboardController from "./dashboardController.js";
import { authenticateToken } from "../middlewares/auth.js";

const dashboardRouter = Router();

dashboardRouter.get(
  "/getallexpenses",
  authenticateToken,
  DashboardController.getAllExpenses,
);

export default dashboardRouter;
