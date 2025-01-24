import { Router } from "express";
import WhatsappController from "./whatsappController.js";

const whatsappRouter = Router();

whatsappRouter.post("/webhook", WhatsappController.handleWebhook);
whatsappRouter.get("/webhook", WhatsappController.verifyWebhook);

export default whatsappRouter;
