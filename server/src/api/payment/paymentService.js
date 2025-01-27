import paypal from "paypal-rest-sdk";
import logger from "../utils/logger.js";
import FriendService from "../friends/friendService.js";
import GroupService from "./../groups/groupService.js";
import PaymentDb from "./paymentDb.js";
import GroupDb from "../groups/groupDb.js";
import AuditLogService from "../audit/auditService.js";
import { auditLogFormat } from "../utils/auditFormat.js";

// PayPal Configuration
paypal.configure({
  "mode": "sandbox", // 'sandbox' or 'live'
  "client_id": process.env.PAYPAL_CLIENT_ID,
  "client_secret": process.env.PAYPAL_SECRET
});

class PaymentService {
  static createPayment = async(data, userId) => {
    const { amount, type, id, payerId, debtorId } = data;

    let payerUserId = payerId;
    let debtorUserId = debtorId;

    if (type === "groups") {
      const [ payer, debtor ] = await GroupDb.getGroupMembersByIds([ payerId, debtorId ], "group_membership_id");

      payerUserId = payer.member_id;
      debtorUserId = debtor.member_id;
    }

    // Create payment JSON
    const paymentJson = {
      "intent": "sale",
      "payer": {
        "payment_method": "paypal"
      },
      "transactions": [ {
        "amount": {
          "total": amount,
          "currency": "USD"
        },
        "payee": {
          "email": "sb-w3pkh35878679@personal.example.com" // Receiver's PayPal email
        },
        "description": "Settlement Testing"
      } ],
      "redirect_urls": {
        "return_url": `http://localhost:3000/api/payments/execute-payment?type=${type}&id=${id}&userId=${userId}&success=true`,
        "cancel_url": `http://localhost:3000/api/payments/execute-payment?type=${type}&id=${id}&success=false`
      }
    };

    // Wrap PayPal's payment.create in a Promise
    const createPayment = async() => {
      return new Promise((resolve, reject) => {
        paypal.payment.create(paymentJson, (error, payment) => {
          if (error) {
            reject(error);
          } else {
            resolve(payment);
          }
        });
      });
    };

    // Use await to handle the Promise returned by createPayment
    const payment = await createPayment();

    const createdPayment = await PaymentDb.createPayment({ "payment_id": payment.id, "payment_method": payment.payer.payment_method, "amount": amount, "payer_id": payerUserId, "payee_id": debtorUserId });
    
    AuditLogService.createLog(auditLogFormat("INSERT", userId, "payments", createdPayment.id, { "newData": createdPayment.dataValues }));
    
    // Find approval URL for the user to approve the payment
    const approvalUrl = payment.links.find((link) => link.rel === "approval_url").href;

    return approvalUrl;
  };

  static async executePaypalPayment(paymentId, paypalPayerId) {
    return new Promise((resolve, reject) => {
      paypal.payment.execute(paymentId, paypalPayerId, (error, payment) => {
        if (error) {
          reject(error); // Reject on error
        } else {
          resolve(payment); // Resolve on success
        }
      });
    });
  }

  static executePayment = async(req) => {
    const { type, id, success, paymentId, PayerID, userId } = req.query;

    if (success === "false") {
      return `http://localhost:4200/${type}?id=${id}&success=false`;
    }

    const payment = await PaymentDb.getPayment(paymentId);
    const oldPayment = { ...payment.dataValues };
    // const paymentId = req.query.paymentId; // from PayPal URL
    const paypalPayerId = { "payer_id": PayerID }; // from PayPal URL

    const { amount, "payer_id": payerId, "payee_id": debtorId } = payment;

    const logs = [];

    try {
      // Await the PayPal execution
      const paymentDetails = await this.executePaypalPayment(paymentId, paypalPayerId);
  
      // After payment succeeds, handle type-based logic
      switch (type) {
        case "friends": {
          // Await the friend expense addition
          const settlement = await FriendService.addExpense({ "total_amount": amount, "split_type": "SETTLEMENT" }, userId, id);

          logs.push(auditLogFormat("INSERT", userId, "friends_expenses", settlement.friend_expense_id, { "newData": settlement.dataValues }));
          
          Object.assign(payment, { "transaction_id": paymentDetails.transactions[ 0 ].related_resources[ 0 ].sale.id, "payment_status": "COMPLETED", "friend_settlement_id": settlement.friend_expense_id, "paypal_payer_id": PayerID });

          await payment.save();
          logs.push(auditLogFormat("UPDATE", userId, "payments", payment.id, { "oldData": oldPayment, "newData": payment.dataValues }));
          break;
        }
        case "groups": {
          const [ payer, debtor ] = await GroupDb.getGroupMembersByIds([ payerId, debtorId ], "member_id", { "group_id": id });

          const payerMembershipId = payer.group_membership_id;
          const debtorMembershipId = debtor.group_membership_id;

          // Await the group settlement addition
          const settlement = await GroupService.addSettlement({ "payer_id": payerMembershipId, "debtor_id": debtorMembershipId, "settlement_amount": amount }, id, userId);

          logs.push(auditLogFormat("INSERT", userId, "group_settlements", settlement.group_settlement_id, { "newData": settlement.dataValues }));

          Object.assign(payment, { "transaction_id": paymentDetails.transactions[ 0 ].related_resources[ 0 ].sale.id, "payment_status": "COMPLETED", "group_settlement_id": settlement.group_settlement_id, "paypal_payer_id": PayerID });

          await payment.save();
          logs.push(auditLogFormat("UPDATE", userId, "payments", payment.id, { "oldData": oldPayment, "newData": payment.dataValues }));
          break;
        }
        default:
          // Return failure URL if type is unknown
          return `http://localhost:4200/${type}?id=${id}&success=false`;
      }

      AuditLogService.createLog(logs, true);
  
      // Return success URL once all operations are completed
      return `http://localhost:4200/${type}?id=${id}&success=true`;
  
    } catch (error) {
      // If there's an error, return a failure URL with success=false
      logger.log({
        "level": "error",
        "statusCode": error.statusCode || 500,
        "message": error.message || "Error while executing payment",
        "stack": error.stack || "No stack trace available"
      });
      Object.assign(payment, { "payment_status": "FAILED" });
      await payment.save();
      AuditLogService.createLog(auditLogFormat("UPDATE", userId, "payments", payment.id, { "oldData": oldPayment, "newData": payment.dataValues }));
      return `http://localhost:4200/${type}?id=${id}&success=false`;
    }
  };
}

export default PaymentService;
