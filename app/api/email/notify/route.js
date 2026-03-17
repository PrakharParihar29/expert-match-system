import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/emailService";

export async function POST(req) {
  try {
    const { experts, candidate } = await req.json();

    if (!experts || !Array.isArray(experts)) {
      return NextResponse.json({ message: "Invalid expert list" }, { status: 400 });
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

      return sendEmail({ to: expert.email, subject, text });
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
