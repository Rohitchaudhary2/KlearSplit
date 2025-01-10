import asyncHandler from "../utils/asyncHandler.js";
import { responseHandler } from "../utils/responseHandler.js";
import DashboardService from "./dashboardService.js";

class DashboardController {
  static getExpensesCount = asyncHandler(async(req, res) => {
    const expensesCount = await DashboardService.getExpensesCount(req.user.user_id);

    responseHandler(res, 200, "Successfully fetched expenses count", expensesCount);
  });

  static getBalance = asyncHandler(async(req, res) => {
    const balance = await DashboardService.getBalance(req.user.user_id);

    responseHandler(res, 200, "Successfully fetched balance", balance);
  });

  static topCashFlowFriends = asyncHandler(async(req, res) => {
    const topFriends = await DashboardService.topCashFlowFriends(req.user.user_id);

    responseHandler(res, 200, "Successfully fetched top cash flow friends", topFriends);
  });

  static topcashflowGroups = asyncHandler(async(req, res) => {
    const topGroups = await DashboardService.topCashFlowGroups(req.user.user_id);

    responseHandler(res, 200, "Successfully fetched top cash flow groups", topGroups);
  });

  static getMonthlyExpenses = asyncHandler(async(req, res) => {
    const monthlyExpense = await DashboardService.getMonthlyExpenses(req.user.user_id, req.body.year);

    responseHandler(res, 200, "Successfully fetched monthly expenses", monthlyExpense);
  });
}

export default DashboardController;
