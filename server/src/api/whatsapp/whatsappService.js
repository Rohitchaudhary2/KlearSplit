import { sendCollectExpenseDetailsMessage } from "../utils/whatsappMessage.js";

class WhatsappService {
  static handleWebhook = async(entry) => {
    entry.forEach((change) => {
      const messages = change.messaging;
  
      messages.forEach((message) => {
        if (message.type === "button") {
          // Parse the button payload
          const payload = JSON.parse(message.button.payload);
  
          if (payload.action === "ADD_EXPENSE") {
            // Delegate sending follow-up messages to the service
            sendCollectExpenseDetailsMessage(message.from); // Pass the user's phone number
          }
        }
      });
    });
  };
}

export default WhatsappService;
