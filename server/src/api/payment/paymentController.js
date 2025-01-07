import asyncHandler from "../utils/asyncHandler.js";
import { responseHandler } from "../utils/responseHandler.js";
import PaymentService from "./paymentService.js";

class PaymentController {
  static createPayment = asyncHandler(async(req, res) => {
    const url = await PaymentService.createPayment(req.body, req.user.user_id);

    responseHandler(res, 200, "Successfully created payment", url);
  });

  static executePayment = asyncHandler(async(req, res) => {
    const url = await PaymentService.executePayment(req);
    
    return res.redirect(url);
  });
}

export default PaymentController;
