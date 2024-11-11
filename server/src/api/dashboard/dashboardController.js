import { responseHandler } from "../utils/responseHandler.js";
import DashboardService from "./dashboardService.js";

class DashboardController {
  static getAllExpenses = async (req, res, next) => {
    try {
      const { user_id } = req.user;
      const expenses = await DashboardService.getAllExpenses(user_id);
      responseHandler(res, 200, "Successfully fetched Expenses", expenses);
    } catch (error) {
      next(error);
    }
  };
}

export default DashboardController;
