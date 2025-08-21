import nodemailer from "nodemailer";

export function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendVerifyEmail(to, code) {
  const transporter = getTransporter();
  const html = `
    <div style="font: 16px system-ui">
      <p>Your verification code:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p>
      <p>This code expires in 15 minutes.</p>
    </div>
  `;
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: "Verify your email",
    html,
  });
}
