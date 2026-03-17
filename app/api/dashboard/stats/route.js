import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Expert from "@/models/Expert";
import Candidate from "@/models/Candidate";
import Match from "@/models/Match";

export async function GET() {
  try {
    await connectToDatabase();

    const totalExperts = await Expert.countDocuments();
    const totalCandidates = await Candidate.countDocuments();
    const totalMatches = await Match.countDocuments();

    // Expertise frequency (for word cloud or chart)
    const experts = await Expert.find({}, "expertiseKeywords");
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
    const recentCandidates = await Candidate.find({})
      .sort({ createdAt: -1 })
      .limit(5);

    // Count matches grouped by Date (last 7 days simulation roughly)
    // Mongoose aggregation for timeseries
    const matchTrends = await Match.aggregate([
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
      topExpertise,
      recentCandidates,
      trendData,
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}
