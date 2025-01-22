import { Router } from "express";
import WhatsappController from "./whatsappController.js";

const whatsappRouter = Router();

whatsappRouter.post("/webhook", WhatsappController.handleWebhook);

export default whatsappRouter;
