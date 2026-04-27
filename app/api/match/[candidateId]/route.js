import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Match from "@/models/Match";
import Expert from "@/models/Expert";
import Candidate from "@/models/Candidate";

export async function GET(req, { params }) {
  try {
    await connectToDatabase();
    const { candidateId } = await params;

    if (!candidateId) {
      return NextResponse.json({ message: "Candidate ID required" }, { status: 400 });
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return NextResponse.json({ message: "Candidate not found" }, { status: 404 });
    }

    // Fetch matches for this candidate, sorted by matchScore descending
    const matches = await Match.find({ candidateId })
      .populate('expertId')
      .sort({ matchScore: -1 });

    if (matches.length === 0) {
      return NextResponse.json({ message: "No matches found for this candidate" }, { status: 404 });
    }

    // Format the response similar to the POST response
    const topMatches = matches.map(match => ({
      expert: match.expertId,
      finalScore: match.matchScore,
      matchedTerms: [] // Could add if needed
    }));

    return NextResponse.json({
      candidateId,
      candidate,
      topMatches,
      message: "Matches retrieved successfully"
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}