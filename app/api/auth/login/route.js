import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { signToken } from "@/lib/auth";

export async function POST(req) {
  try {
    await connectToDatabase();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Seed logic (if no users exists)
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      if (email === "admin@example.com" && password === "admin123") {
        const hashedPassword = await bcrypt.hash("admin123", 10);
        await User.create({ name: "Admin", email: "admin@example.com", password: hashedPassword });
      }
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const payload = { userId: user._id, role: user.role, name: user.name, email: user.email };
    const token = signToken(payload);

    const response = NextResponse.json({ message: "Login successful", user: { name: user.name, email: user.email } }, { status: 200 });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    return response;
  } catch (error) {
    console.error("Login error:", error.message, error.stack);
    const isConnectionError = error.message?.includes("ECONNREFUSED") || 
                               error.message?.includes("serverSelection") ||
                               error.message?.includes("connect ETIMEDOUT") ||
                               error.name === "MongoServerSelectionError";
    const message = isConnectionError 
      ? "Database connection failed. Please try again later." 
      : "Server error";
    return NextResponse.json({ message, error: error.message }, { status: 500 });
  }
}
