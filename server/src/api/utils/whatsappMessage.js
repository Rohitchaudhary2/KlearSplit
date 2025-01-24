import got from "got";

const API_URL = "https://graph.facebook.com/v21.0/";
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID; // Set in your .env
const WHATSAPP_BUSINESS_SECRET = process.env.WHATSAPP_BUSINESS_SECRET; // Set in your .env
const url = `${API_URL}/${WHATSAPP_PHONE_ID}/messages`;

/**
 * Sends a WhatsApp message using the Meta API.
 * @param {Array<Object>} participants - List of participants to send the message to, including details like phone, first_name, and last_name.
 * @param {Object} expenseDetails - Details of the expense.
 * @returns {Promise<void>} - Resolves if messages are sent successfully.
 */
const sendWhatsAppTemplateMessage = async(
  participants,
  expenseDetails
) => {
  const promises = participants.map(async(participant) => {
    // Create personalized variables for the recipient
    const recipientName = `${participant.first_name} ${participant.last_name ?? ""}`.trim();
    const participantList = participants.map((p) => `${p.first_name} ${p.last_name ?? ""}`.trim());
    const participantListVariable = participantList.length > 3 ? [
      ...participantList.slice(0, 3).map((name, index, arr) =>
        (index === arr.length - 1 ? `${name} and ${participantList.length - 3} others` : name)
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

    // Send the message via Meta API using `got`
    try {
      const response = await got.post(url, {
        "json": messageData,
        "responseType": "json", // This will parse the response as JSON
        "headers": {
          "Authorization": `Bearer ${WHATSAPP_BUSINESS_SECRET}`,
          "Content-Type": "application/json"
        }
      });

      return response.body; // `got` automatically parses JSON responses
    } catch (error) {
      // Handle errors and return response if available
      return error.response ? error.response.body : error.message;
    }
  });

  const responses = await Promise.all(promises);

  return responses;
};

/**
 * Sends a WhatsApp welcome message with an interactive button.
 * @param {Object} user - User details containing phone, first_name, and last_name.
 * @returns {Promise<void>} - Resolves if the message is sent successfully.
 */
const sendWelcomeMessage = async(user) => {
  const responses = [];

  // Message template object for the welcome message
  const messageData = {
    "messaging_product": "whatsapp",
    "to": `91${user.phone}`, // Send to the user's phone number
    "type": "template",
    "template": {
      "name": "welcome_message", // Replace with your approved welcome template name
      "language": { "code": "en_US" },
      "components": [
        {
          "type": "body",
          "parameters": [
            { "type": "text", "text": `${user.first_name} ${user.last_name ?? ""}`.trim() }
          ]
        },
        {
          "type": "button",
          "sub_type": "quick_reply", // Button type (quick reply for simple action)
          "index": 0,
          "parameters": [
            {
              "type": "payload",
              "payload": JSON.stringify({ "action": "ADD_EXPENSE" }) // Payload for handling in webhook
            }
          ]
        }
      ]
    }
  };

  try {
    const response = await got.post(url, {
      "json": messageData,
      "responseType": "json",
      "headers": {
        "Authorization": `Bearer ${WHATSAPP_BUSINESS_SECRET}`,
        "Content-Type": "application/json"
      }
    });

    responses.push(response.body);
  } catch (error) {
    responses.push(error.response ? error.response.body : error.message);
  }
  return responses;
};

const sendCollectExpenseDetailsMessage = async(phone) => {
  const responses = [];

  // Message to ask for the expense name
  const messageData = {
    "messaging_product": "whatsapp",
    "to": phone,
    "type": "text",
    "text": {
      "body": "Please provide the following details in same order without numbering:\n1. Expense Name\n2. Total Amount\n3. Split Type (Equal/Unequal/Percent)\n4. Payer's Phone Numbers\n5. Debtor's Phone Number\n5. Payer's Share\n6. Debtor's Share"
    }
  };

  try {
    const response = await got.post(url, {
      "json": messageData,
      "responseType": "json",
      "headers": {
        "Authorization": `Bearer ${WHATSAPP_BUSINESS_SECRET}`,
        "Content-Type": "application/json"
      }
    });

    responses.push(response.body);
  } catch (error) {
    responses.push(error.response ? error.response.body : error.message);
  }
  return responses;
};

const sendAddExpenseButton = async(phone) => {
  const responses = [];

  // Message template object for the welcome message
  const messageData = {
    "messaging_product": "whatsapp",
    "to": `91${phone}`, // Send to the user's phone number
    "type": "template",
    "template": {
      "name": "add_expense_button_template", // Replace with your approved welcome template name
      "language": { "code": "en_US" },
      "components": [
        {
          "type": "button",
          "sub_type": "quick_reply", // Button type (quick reply for simple action)
          "index": 0,
          "parameters": [
            {
              "type": "payload",
              "payload": JSON.stringify({ "action": "ADD_EXPENSE" }) // Payload for handling in webhook
            }
          ]
        }
      ]
    }
  };

  try {
    const response = await got.post(url, {
      "json": messageData,
      "responseType": "json",
      "headers": {
        "Authorization": `Bearer ${WHATSAPP_BUSINESS_SECRET}`,
        "Content-Type": "application/json"
      }
    });

    responses.push(response.body);
  } catch (error) {
    responses.push(error.response ? error.response.body : error.message);
  }
  return responses;
};

export {
  sendWhatsAppTemplateMessage,
  sendWelcomeMessage,
  sendCollectExpenseDetailsMessage,
  sendAddExpenseButton
};
