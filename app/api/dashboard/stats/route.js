import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Expert from "@/models/Expert";
import Candidate from "@/models/Candidate";
import Match from "@/models/Match";
import { verifyToken } from "@/lib/auth";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    await connectToDatabase();

    const token = req.cookies.get("token")?.value;
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { userId } = decoded;

    const totalExperts = await Expert.countDocuments({ userId });
    const totalCandidates = await Candidate.countDocuments({ userId });
    const totalMatches = await Match.countDocuments({ userId });

    // Pending candidates (candidates who have zero matches)
    const matchedCandidateIds = await Match.distinct("candidateId", { userId });
    const pendingCandidates = await Candidate.countDocuments({ 
      userId, 
      _id: { $nin: matchedCandidateIds } 
    });

    // Expertise frequency (for word cloud or chart)
    const experts = await Expert.find({ userId }, "expertiseKeywords");
    const keywordMap = {};
    experts.forEach((expert) => {
      expert.expertiseKeywords.forEach((kw) => {
        const lower = kw.toLowerCase();
        keywordMap[lower] = (keywordMap[lower] || 0) + 1;
      });
    });
    
    // Sort and limit top expertise
    const topExpertise = Object.entries(keywordMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Latest candidates
    const recentCandidates = await Candidate.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5);

    // Count matches grouped by Date (last 7 days simulation roughly)
    // Mongoose aggregation for timeseries
    const matchTrends = await Match.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 7 }
    ]);
    const trendData = matchTrends.map(m => ({ date: m._id, matches: m.count }));

    return NextResponse.json({
      totalExperts,
      totalCandidates,
      totalMatches,
      pendingCandidates,
      topExpertise,
      recentCandidates,
      trendData,
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}
