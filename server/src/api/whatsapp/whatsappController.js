import asyncHandler from "../utils/asyncHandler.js";
import { responseHandler } from "../utils/responseHandler.js";
import WhatsappService from "./whatsappService.js";

class WhatsappController {
  static handleWebhook = asyncHandler(async(req, res) => {
    const { entry } = req.body;

    const webhookData = await WhatsappService.handleWebhook(entry);

    responseHandler(res, 201, "Successfully handled request", webhookData);
  });
}

export default WhatsappController;
