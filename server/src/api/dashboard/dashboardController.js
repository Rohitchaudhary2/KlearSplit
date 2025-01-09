import asyncHandler from "../utils/asyncHandler.js";
import { responseHandler } from "../utils/responseHandler.js";
import DashboardService from "./dashboardService.js";

class DashboardController {
  /**
   * Fetches all expense data for a specific user.
   * @param {Object} req - The request object, which contains the authenticated user's information.
   * @param {Object} res - The response object used to send the response back to the client.
   * @param {Function} next - The next middleware function, used to pass errors to the error handler.
   * @returns {Promise<void>} - This function sends a response to the client or passes an error to the error handler.
   */
  static getAllExpensesData = asyncHandler(async(req, res) => {
    const expenses = await DashboardService.getAllExpensesData(req.user.user_id);

    responseHandler(res, 200, "Successfully fetched Expenses", expenses);
  });

  static getExpensesCount = asyncHandler(async(req, res) => {
    const expensesCount = await DashboardService.getExpensesCount(req.user.user_id);

    responseHandler(res, 200, "Successfully fetched expenses count", expensesCount);
  });

  static getBalance = asyncHandler(async(req, res) => {
    const balance = await DashboardService.getBalance(req.user.user_id);

    responseHandler(res, 200, "Successfully fetched expenses count", balance);
  });

  static topCashFlowFriends = asyncHandler(async(req, res) => {
    const topFriends = await DashboardService.topCashFlowFriends(req.user.user_id);

    responseHandler(res, 200, "Successfully fetched expenses count", topFriends);
  });

  static topcashflowGroups = asyncHandler(async(req, res) => {
    const topGroups = await DashboardService.topCashFlowGroups(req.user.user_id);

    responseHandler(res, 200, "Successfully fetched expenses count", topGroups);
  });

  static getMonthlyExpenses = asyncHandler(async(req, res) => {
    const monthlyExpense = await DashboardService.getMonthlyExpenses(req.user.user_id, req.body.year);

    responseHandler(res, 200, "Successfully fetched expenses count", monthlyExpense);
  });
}

export default DashboardController;
