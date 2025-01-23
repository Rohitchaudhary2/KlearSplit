import asyncHandler from "../utils/asyncHandler.js";
import { responseHandler } from "../utils/responseHandler.js";
import WhatsappService from "./whatsappService.js";

class WhatsappController {
  static handleWebhook = asyncHandler(async(req, res) => {
    const { entry } = req.body;

    // console.log("Full Payload:", JSON.stringify(req.body, null, 2));

    const webhookData = await WhatsappService.handleWebhook(entry);

    responseHandler(res, 201, "Successfully handled request", webhookData);
  });

  static verifyWebhook = asyncHandler(async(req, res) => {
    const mode = req.query[ "hub.mode" ];
    const token = req.query[ "hub.verify_token" ];
    const challenge = req.query[ "hub.challenge" ];

    const verificationData = await WhatsappService.verifyWebhook(mode, token, challenge);

    res.status(200).send(verificationData);
  });
}

export default WhatsappController;
