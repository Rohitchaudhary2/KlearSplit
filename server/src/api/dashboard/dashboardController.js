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
  static getAllExpensesData = async(req, res, next) => {
    try {
      const expenses = await DashboardService.getAllExpensesData(req.user.user_id);

      responseHandler(res, 200, "Successfully fetched Expenses", expenses);
    } catch (error) {
      next(error);
    }
  };
}

export default DashboardController;
