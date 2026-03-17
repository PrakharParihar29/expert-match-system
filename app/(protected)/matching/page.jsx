"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bot, UserSearch } from "lucide-react";

function MatchingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCandidateId = searchParams.get("candidateId") || "";

  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(initialCandidateId);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);

  useEffect(() => {
    fetch("/api/candidates")
      .then((res) => res.json())
      .then((data) => {
        setCandidates(data);
        setLoading(false);
      });
  }, []);

  const handleMatch = async () => {
    if (!selectedCandidate) return;
    
    setMatching(true);
    try {
      // The heavy TF-IDF calculation
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: selectedCandidate }),
      });

      if (res.ok) {
        router.push(`/matching/results/${selectedCandidate}`);
      } else {
        alert("Failed to run matching engine.");
        setMatching(false);
      }
    } catch (err) {
      console.error(err);
      setMatching(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 mt-10 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
          <Bot className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Smart Expert Matching</h1>
        <p className="text-gray-500 max-w-lg mx-auto">
          Our intelligent engine uses TF-IDF Vectorization and Cosine Similarity to find the best interviewers for your candidates.
        </p>
      </div>

      <div className="bg-white border border-gray-100 shadow-xl shadow-indigo-50/50 rounded-2xl p-8">
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <UserSearch className="w-4 h-4 text-gray-400" />
              Select Candidate to Evaluate
            </label>
            
            {loading ? (
              <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 animate-pulse">
                Loading candidates...
              </div>
            ) : (
              <select
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                value={selectedCandidate}
                onChange={(e) => setSelectedCandidate(e.target.value)}
              >
                <option value="" disabled>-- Choose a candidate --</option>
                {candidates.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            onClick={handleMatch}
            disabled={!selectedCandidate || matching}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-medium shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {matching ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Running Match Algorithm...
              </>
            ) : (
              <>
                <Bot className="w-5 h-5 group-hover:animate-bounce" />
                Find Best Match
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MatchingPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-gray-500">Loading Configuration...</div>}>
       <MatchingContent />
    </Suspense>
  )
}
