import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/emailService";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";

export async function POST(req) {
  try {
    const token = req.cookies.get("token")?.value;
    const decoded = token ? verifyToken(token) : null;
    if (!decoded) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const currentUser = await User.findById(decoded.userId);

    const { experts, candidate, fromEmail, appPassword } = await req.json();

    if (!experts || !Array.isArray(experts)) {
      return NextResponse.json({ message: "Invalid expert list" }, { status: 400 });
    }

    const authUser = fromEmail || currentUser?.senderEmail || process.env.EMAIL_USER;
    const authPass = appPassword || currentUser?.senderAppPassword || process.env.EMAIL_PASS;

    if (!authUser || !authPass) {
      return NextResponse.json(
        { message: "Sender email and 16-digit app password are required to send mail." },
        { status: 400 }
      );
    }

    const promises = experts.map((expert) => {
      const subject = `Interview Panel Selection - Action Required`;
      const text = `
Dear ${expert.name},

You have been selected as an expert for an upcoming interview panel based on your expertise and experience.
The candidate's profile strongly matches your following areas of expertise.

Further details will be shared soon.

Regards,
Interview Board Management System
      `.trim();

      return sendEmail({
        to: expert.email,
        subject,
        text,
        from: authUser,
        authUser,
        authPass,
      });
    });

    const results = await Promise.all(promises);
    const failed = results.filter((r) => !r.success);

    if (failed.length > 0) {
      return NextResponse.json({ message: "Some emails failed to send", failed }, { status: 207 });
    }

    return NextResponse.json({ message: "Emails sent successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}
