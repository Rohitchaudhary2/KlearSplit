import nodemailer from "nodemailer";
import ejs from 'ejs'
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import { ErrorHandler } from "../middlewares/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

const sendMail = async (options, template, data, next) => {
  try {
    const html = await ejs.renderFile(path.join(__dirname, '../views/' + template + '.ejs'), data, { async: true })
    const mailOptions = {
      from: process.env.SMTP_MAIL,
      to: options.email,
      subject: options.subject,
      html
    }
    await transporter.sendMail(mailOptions);
  } catch (error) {
      throw next(new ErrorHandler(500, error.message))
  }  
}
export default sendMail;
