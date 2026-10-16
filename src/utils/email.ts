import config from "../config/index.js";
import { transporter } from "../lib/nodemailer.js";

export type TEmail = {
  to: string;
  subject: string;
  html: string;
};

// Never throws. Returns whether the mail went out, so a caller that depends
// on it (the OTP) can fail the request, while notifications just ignore it.
// Awaited by callers because a serverless function may be frozen once it responds.
export const sendEmail = async ({ to, subject, html }: TEmail) => {
  try {
    await transporter.sendMail({
      from: `"RentNest" <${config.email_sender}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.warn(
      `Email "${subject}" was not sent: ${error instanceof Error ? error.message : "unknown error"}`,
    );
    return false;
  }
};

// ── Templates ───────────────────────────────────────────────────────────────

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const layout = (title: string, body: string) => `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1f2933">
  <div style="background:#0f766e;color:#ffffff;padding:16px 24px;font-size:20px;font-weight:bold">RentNest</div>
  <div style="padding:24px;border:1px solid #d9e2ec;border-top:none">
    <h2 style="margin:0 0 16px;font-size:18px">${escapeHtml(title)}</h2>
    ${body}
    <p style="margin:24px 0 0;font-size:12px;color:#7b8794">This is an automated message from RentNest. Please do not reply.</p>
  </div>
</div>`;

const paragraph = (text: string) =>
  `<p style="margin:0 0 12px;line-height:1.5">${escapeHtml(text)}</p>`;

const formatDhaka = (date: Date) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);

export const otpEmail = (user: {
  name: string;
  email: string;
  otp: string;
  ttlSeconds: number;
}): TEmail => ({
  to: user.email,
  subject: "Your RentNest verification code",
  html: layout(
    "Verify your email",
    paragraph(`Hi ${user.name}, use this code to verify your email address:`) +
      `<p style="margin:16px 0;font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center">${escapeHtml(user.otp)}</p>` +
      paragraph(
        `The code expires in ${user.ttlSeconds / 60} minute. If you did not sign up for RentNest, you can ignore this email.`,
      ),
  ),
});

export const welcomeEmail = (user: {
  name: string;
  email: string;
  role: string;
}): TEmail => ({
  to: user.email,
  subject: "Welcome to RentNest",
  html: layout(
    `Welcome, ${user.name}`,
    paragraph(
      user.role === "LANDLORD"
        ? "Your landlord account is ready. You can now list your properties and manage rental requests."
        : "Your tenant account is ready. You can now browse properties and send rental requests.",
    ),
  ),
});

export const loginAlertEmail = (user: {
  name: string;
  email: string;
  method: "password" | "Google";
  at: Date;
}): TEmail => ({
  to: user.email,
  subject: "New login to your RentNest account",
  html: layout(
    "New login",
    paragraph(
      `Hi ${user.name}, your account was just logged in to with ${user.method} on ${formatDhaka(user.at)} (Dhaka time).`,
    ) +
      paragraph(
        "If this was not you, change your password right away and contact support.",
      ),
  ),
});
