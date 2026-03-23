import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Candidate from "@/models/Candidate";
import { verifyToken } from "@/lib/auth";

export async function GET(req, { params }) {
  try {
    await connectToDatabase();
    const token = req.cookies.get("token")?.value;
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const id = (await params).id;
    const candidate = await Candidate.findOne({ _id: id, userId: decoded.userId });
    if (!candidate) {
      return NextResponse.json({ message: "Candidate not found" }, { status: 404 });
    }
    return NextResponse.json(candidate, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectToDatabase();
    const token = req.cookies.get("token")?.value;
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const id = (await params).id;
    const deleted = await Candidate.findOneAndDelete({ _id: id, userId: decoded.userId });
    if (!deleted) {
      return NextResponse.json({ message: "Candidate not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Candidate deleted successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}
