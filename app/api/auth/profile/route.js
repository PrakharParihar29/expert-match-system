import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";

async function getCurrentUser(req) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded) return null;

  await connectToDatabase();
  return await User.findById(decoded.userId);
}

export async function GET(req) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      name: currentUser.name,
      email: currentUser.email,
      senderEmail: currentUser.senderEmail || "",
      senderConfigured: Boolean(currentUser.senderEmail && currentUser.senderAppPassword),
    });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { senderEmail, senderAppPassword } = await req.json();
    if (!senderEmail || !senderEmail.includes("@")) {
      return NextResponse.json({ message: "A valid sender email is required." }, { status: 400 });
    }
    const cleanAppPassword = senderAppPassword ? senderAppPassword.replaceAll(" ", "") : "";
    if (!cleanAppPassword || cleanAppPassword.length !== 16) {
      return NextResponse.json({ message: "A valid 16-character Gmail app password is required." }, { status: 400 });
    }

    currentUser.senderEmail = senderEmail;
    currentUser.senderAppPassword = cleanAppPassword;
    await currentUser.save();

    return NextResponse.json({
      message: "Profile sender settings updated.",
      senderEmail: currentUser.senderEmail,
    });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}
