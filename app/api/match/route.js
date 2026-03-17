import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Candidate from "@/models/Candidate";
import Expert from "@/models/Expert";
import Match from "@/models/Match";
import { findTopExperts } from "@/lib/matchingEngine";

export async function POST(req) {
  try {
    await connectToDatabase();
    const { candidateId } = await req.json();

    if (!candidateId) {
      return NextResponse.json({ message: "Candidate ID required" }, { status: 400 });
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return NextResponse.json({ message: "Candidate not found" }, { status: 404 });
    }

    if (!candidate.keywords || candidate.keywords.length === 0) {
      return NextResponse.json({ message: "Candidate has no extracted keywords" }, { status: 400 });
    }

    const allExperts = await Expert.find({});
    if (allExperts.length === 0) {
      return NextResponse.json({ message: "No experts available in the database" }, { status: 404 });
    }

    // Run the matching engine
    const topMatches = findTopExperts(candidate.keywords, allExperts);

    // Filter duplicates (avoid assigning the same expert multiple times)
    // Actually, saving match state prevents duplicates. Let's record them in the Match collection.
    const savedMatches = [];
    for (const matchInfo of topMatches) {
      // Check if match already exists
      const existingMatch = await Match.findOne({
        candidateId: candidate._id,
        expertId: matchInfo.expert._id,
      });

      if (!existingMatch) {
         const newMatch = await Match.create({
           candidateId: candidate._id,
           expertId: matchInfo.expert._id,
           matchScore: matchInfo.finalScore,
         });
         // Populate virtual fields for frontend
         savedMatches.push({ ...matchInfo, id: newMatch._id });
      } else {
         // Already exists
         existingMatch.matchScore = matchInfo.finalScore; // update score potentially
         await existingMatch.save();
         savedMatches.push({ ...matchInfo, id: existingMatch._id });
      }
    }

    return NextResponse.json({
      message: "Match generated successfully",
      candidate,
      topMatches: savedMatches,
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}
