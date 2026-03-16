import nodemailer from "nodemailer";

export async function sendEmail({ to, subject, text }) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER || "test@example.com",
      pass: process.env.EMAIL_PASS || "password123",
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER || "test@example.com",
    to,
    subject,
    text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, info };
  } catch (error) {
    console.error("Error sending email", error);
    return { success: false, error: error.message };
  }
}
