import nodemailer from "nodemailer";

export async function sendEmail({ to, subject, text, from, authUser, authPass }) {
  const user = authUser || process.env.EMAIL_USER || "test@example.com";
  const pass = authPass || process.env.EMAIL_PASS || "password123";

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });

  const mailOptions = {
    from: from || user,
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
