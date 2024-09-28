import nodemailer from "nodemailer";
import { ErrorHandler } from "../middlewares/errorHandler.js";

// Looking to send emails in production? Check out our Email API/SMTP product!
const transporter = nodemailer.createTransport({
  service: "Gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendMail = async (options, next) => {
  const mailOptions = {
    from: process.env.SMTP_MAIL,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw next(new ErrorHandler(500, error.message))
  }
};

export default sendMail;
