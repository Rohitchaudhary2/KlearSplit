import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.js";
import PaymentController from "./paymentController.js";
import { validateBody } from "../middlewares/validationMiddleware.js";
import * as PaymentSchema from "./paymentValidations.js";

const paymentRouter = Router();

paymentRouter.post("/create-payment", authenticateToken, validateBody(PaymentSchema.createPayment), PaymentController.createPayment);

paymentRouter.get("/execute-payment", PaymentController.executePayment);

export default paymentRouter;
