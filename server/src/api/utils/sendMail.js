import nodemailer from "nodemailer";
import ejs from "ejs";
import { fileURLToPath } from "url";
import path, { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const transporter = nodemailer.createTransport({
  "service": "Gmail",
  "host": "smtp.gmail.com",
  "port": 465,
  "secure": true,
  "auth": {
    "user": process.env.SMTP_USER,
    "pass": process.env.SMTP_PASSWORD
  }
});

const sendMail = async(options, template, data) => {
  const html = await ejs.renderFile(
    path.join(__dirname, `../views/${ template }.ejs`),
    data,
    { "async": true }
  );
  const mailOptions = {
    "from": process.env.SMTP_MAIL,
    "to": options.email,
    "subject": options.subject,
    html
  };

  await transporter.sendMail(mailOptions);
};

export default sendMail;
