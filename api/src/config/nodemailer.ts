import nodemailer from "nodemailer";
import { env } from "../utils/env.js";

const transporter = nodemailer.createTransport({
  host: "gmail",
  auth: {
    user: env.GMAIL_EMAIL,
    pass: env.GMAIL_PASSWORD,
  },
});

export default transporter;
