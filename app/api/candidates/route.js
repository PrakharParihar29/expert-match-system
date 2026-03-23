import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Candidate from "@/models/Candidate";
import { verifyToken } from "@/lib/auth";

export async function GET(req) {
  try {
    await connectToDatabase();

    const token = req.cookies.get("token")?.value;
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const candidates = await Candidate.find({ userId: decoded.userId }).sort({ createdAt: -1 });
    return NextResponse.json(candidates, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}
