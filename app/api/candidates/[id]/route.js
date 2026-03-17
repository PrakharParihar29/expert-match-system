import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Candidate from "@/models/Candidate";

export async function DELETE(req, { params }) {
  try {
    await connectToDatabase();
    const id = (await params).id;
    const deleted = await Candidate.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ message: "Candidate not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Candidate deleted successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}
