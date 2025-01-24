import FriendDb from "../friends/friendDb.js";
import FriendService from "../friends/friendService.js";
import UserDb from "../users/userDb.js";
import { sendAddExpenseButton, sendCollectExpenseDetailsMessage } from "../utils/whatsappMessage.js";

class WhatsappService {
  static handleWebhook = async(entry) => {
    let addExpenseProcessedData = {};
    // Process each change entry from the webhook

    for (const changeEntry of entry) {
      const messages = changeEntry.changes.flatMap((change) => change.value.messages);
          
      // Process each message
      for (const message of messages) {
        if (message.type === "button") {
          await this.handleButtonMessage(message);
        } else if (message.type === "text") {
          addExpenseProcessedData = await this.handleTextMessage(message);
          await sendAddExpenseButton(message.from.slice(2));
        }
      }
    }
    // Add expense to the conversation
    await FriendService.addExpense(
      addExpenseProcessedData.expenseData,
      addExpenseProcessedData.userId,
      addExpenseProcessedData.conversationId
    );
  };
      
  // Handle button messages (ADD_EXPENSE action)
  static handleButtonMessage = async(message) => {
    const payload = JSON.parse(message.button.payload);

    if (payload.action === "ADD_EXPENSE") {
      await sendCollectExpenseDetailsMessage(message.from);
    }
  };
      
  // Handle text messages that contain expense details
  static handleTextMessage = async(message) => {
    const [ expenseName, totalAmount, splitType, payerPhone, debtorPhone, payerShare, debtorShare ] = message.text.body.split("\n");
      
    // Fetch user details for payer and debtor using their phone numbers
    const [ payer, debtor, currentUser ] = await Promise.all([
      UserDb.getUserByPhone(payerPhone.trim()),
      UserDb.getUserByPhone(debtorPhone.trim()),
      UserDb.getUserByPhone(message.from.slice(2))
    ]);
      
    // Prepare expense data
    const expenseData = this.createExpenseData(expenseName, totalAmount, splitType, payer, debtor, payerShare, debtorShare);
      
    // Get conversation details
    const friendConversation = await FriendDb.getFriendByUserIds(payer.user_id, debtor.user_id);

    return { expenseData, "userId": currentUser.dataValues.user_id, "conversationId": friendConversation.dataValues.conversation_id };
  };
      
  // Utility function to create expense data
  static createExpenseData = (expenseName, totalAmount, splitType, payer, debtor, payerShare, debtorShare) => {
    return {
      "expense_name": expenseName.trim(),
      "total_amount": totalAmount.trim(),
      "split_type": splitType.trim(),
      "payer_id": payer.user_id,
      "debtor_id": debtor.user_id,
      "participant1_share": payerShare.trim(),
      "participant2_share": debtorShare.trim(),
      "debtor_share": debtorShare.trim()
    };
  };
      

  static verifyWebhook = async(mode, token, challenge) => {
    const VERIFY_TOKEN = process.env.WHATSAPP_TOKEN;

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return challenge;
    }
  };
}

export default WhatsappService;
