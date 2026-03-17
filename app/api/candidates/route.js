import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Candidate from "@/models/Candidate";

export async function GET() {
  try {
    await connectToDatabase();
    const candidates = await Candidate.find({}).sort({ createdAt: -1 });
    return NextResponse.json(candidates, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}
