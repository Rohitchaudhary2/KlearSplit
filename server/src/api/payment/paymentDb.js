import { Payment } from "../../config/db.connection.js";

class PaymentDb {
  static createPayment = async(payment) => await Payment.create(payment);

  static getPayment = async(paymentId) => await Payment.findOne({
    "where": {
      "payment_id": paymentId
    }
  });
}

export default PaymentDb;
