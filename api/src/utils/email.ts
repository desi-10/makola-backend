import transporter from "../config/nodemailer.js";
import { env } from "./env.js";

export const verificationCodeEmail = async (
  to: string,
  subject: string,
  html: string
) => {
  const mailOptions = {
    from: env.GMAIL_EMAIL,
    to: to.trim(),
    subject,
    html,
  };
  await transporter.sendMail(mailOptions);
};
