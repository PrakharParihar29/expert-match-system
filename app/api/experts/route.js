import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Expert from "@/models/Expert";

export async function GET() {
  try {
    await connectToDatabase();
    const experts = await Expert.find({}).sort({ createdAt: -1 });
    return NextResponse.json(experts, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectToDatabase();
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

    const expert = await Expert.create({ ...body, expertiseKeywords });
    return NextResponse.json({ message: "Expert added successfully", expert }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}
