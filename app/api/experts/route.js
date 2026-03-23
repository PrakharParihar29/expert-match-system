import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Expert from "@/models/Expert";
import { verifyToken } from "@/lib/auth";

export async function GET(req) {
  try {
    await connectToDatabase();

    const token = req.cookies.get("token")?.value;
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const experts = await Expert.find({ userId: decoded.userId }).sort({ createdAt: -1 });
    return NextResponse.json(experts, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectToDatabase();

    const token = req.cookies.get("token")?.value;
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    // Check if email already exists
    const existing = await Expert.findOne({ email: body.email });
    if (existing) {
      return NextResponse.json({ message: "Expert already exists with this email" }, { status: 400 });
    }

    // Convert comma separated string to array if necessary, or assume it's an array
    let expertiseKeywords = body.expertiseKeywords;
    if (typeof expertiseKeywords === "string") {
      expertiseKeywords = expertiseKeywords.split(",").map(k => k.trim());
    }

    const expert = await Expert.create({ ...body, expertiseKeywords, userId: decoded.userId });
    return NextResponse.json({ message: "Expert added successfully", expert }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}
