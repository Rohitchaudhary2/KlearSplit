import axios from "axios";

/**
 * Sends a WhatsApp message using the Meta API.
 * @param {Array<Object>} participants - List of participants to send the message to, including details like phone, first_name, and last_name.
 * @param {Object} expenseDetails - Details of the expense.
 * @returns {Promise<void>} - Resolves if messages are sent successfully.
 */
export const sendWhatsAppTemplateMessage = async(
  participants,
  expenseDetails
) => {
  const API_URL = "https://graph.facebook.com/v21.0/";
  const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID; // Set in your .env
  const WHATSAPP_BUSINESS_SECRET = process.env.WHATSAPP_BUSINESS_SECRET; // Set in your .env

  const url = `${API_URL}/${WHATSAPP_PHONE_ID}/messages`;

  const responses = [];

  participants.forEach(async(participant) => {
    // Create personalized variables for the recipient
    const recipientName = `${participant.first_name} ${participant.last_name ?? ""}`.trim();
    const participantList = participants.map((p) => `${p.first_name} ${p.last_name ?? ""}`.trim());
    const participantListVariable = participantList.length > 2 ? [
      ...participantList.slice(0, 2).map((name, index, arr) =>
        (index === arr.length - 1 ? `${name}\nand ${participantList.length - 2} others` : name)
      )
    ] : participantList;

    const templateVariables = [
      recipientName, // Personalized for the recipient
      expenseDetails.expense_name,
      expenseDetails.total_amount.toString(),
      ...participantListVariable
    ];

    // Message template object for Meta API
    const messageData = {
      "messaging_product": "whatsapp",
      "to": `91${participant.phone}`,
      "type": "template",
      "template": {
        "name": "expense_notification", // Replace with the exact name of your approved template
        "language": { "code": "en_US" }, // Adjust the language code if needed
        "components": [
          {
            "type": "body",
            "parameters": templateVariables.map((variable) => ({
              "type": "text",
              "text": variable
            }))
          }
        ]
      }
    };

    // Send the message via Meta API
    try {
      const response = await axios.post(url, messageData, {
        "headers": {
          "Authorization": `Bearer ${WHATSAPP_BUSINESS_SECRET}`,
          "Content-Type": "application/json"
        }
      });

      responses.push(response.data);
    } catch (error) {
      responses.push(error.response ? error.response.data : error.message);
    }
  });

  return responses;
};
