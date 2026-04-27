"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Mail, BadgeCheck, Users } from "lucide-react";

export default function MatchingResultsPage() {
  const { candidateId } = useParams();
  const [data, setData] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingAlert, setSendingAlert] = useState(false);
  const [selectedExperts, setSelectedExperts] = useState([]);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/profile")
      .then(async (res) => {
        const payload = await res.json();
        if (!res.ok) {
          setProfileError(payload.message || "Unable to load profile.");
        } else {
          setProfile(payload);
        }
      })
      .catch(() => {
        setProfileError("Unable to load profile.");
      })
      .finally(() => {
        setProfileLoading(false);
      });
    // Fetch candidate info
    fetch(`/api/candidates/${candidateId}`)
      .then((res) => res.json())
      .then((cand) => setCandidate(cand))
      .catch((err) => console.error(err));

    // Fetch matches
    fetch(`/api/match/${candidateId}`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.topMatches) {
          setData(resData);
          // Default select all top 4
          const validMatches = resData.topMatches.filter(m => m && m.expert);
          setSelectedExperts(validMatches.slice(0, 4).map(m => m.expert));
        } else {
          // If no matches, run the matching
          fetch("/api/match", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ candidateId }),
          })
            .then((res) => res.json())
            .then((data) => {
              setData(data);
              if (data.topMatches) {
                const validMatches = data.topMatches.filter(m => m && m.expert);
                setSelectedExperts(validMatches.slice(0, 4).map(m => m.expert));
              }
              setLoading(false);
            });
        }
        setLoading(false);
      });
  }, [candidateId]);

  const toggleExpert = (expert) => {
    setSelectedExperts((prev) => {
      const exists = prev.find((e) => e._id === expert._id);
      if (exists) return prev.filter((e) => e._id !== expert._id);
      return [...prev, expert];
    });
  };

  const handleSendEmails = async () => {
    if (selectedExperts.length === 0) {
      alert("Please select at least one expert to send invites.");
      return;
    }

    setSendingAlert(true);
    try {
      const res = await fetch("/api/email/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate: candidate,
          experts: selectedExperts,
        }),
      });
      if (res.ok) {
        alert("Emails sent successfully to the selected experts!");
      } else {
        const payload = await res.json().catch(() => null);
        alert(payload?.message || "Some emails failed to send. Check console.");
      }
    } catch (err) {
      console.error(err);
      alert("Error sending emails.");
    } finally {
      setSendingAlert(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center flex-col gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-gray-500 font-medium animate-pulse">Computing Cosine Similarities...</p>
      </div>
    );
  }

  if (!data || !data.topMatches) {
    return <div className="p-8 text-red-500">Error loading match results.</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link href="/matching" className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to Selection
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Matching Results</h1>
          {candidate && (
            <div className="mt-2 p-4 bg-gray-50 rounded-lg">
              <h2 className="font-semibold text-gray-800">{candidate.name}</h2>
              <p className="text-sm text-gray-600">{candidate.email}</p>
              <p className="text-sm text-gray-600">Keywords: {candidate.keywords?.join(", ")}</p>
            </div>
          )}

          <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Email settings</h3>
            {profileLoading ? (
              <p className="text-sm text-gray-500">Loading your profile settings...</p>
            ) : profileError ? (
              <p className="text-sm text-red-500">{profileError}</p>
            ) : profile?.senderEmail ? (
              <div>
                <p className="text-sm text-gray-700">Using sender email:</p>
                <p className="font-medium text-gray-900">{profile.senderEmail}</p>
                <p className="text-xs text-gray-500 mt-1">
                  If you need to change this, update it in your <Link href="/profile" className="text-indigo-600 hover:text-indigo-800 underline">Profile settings</Link>.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500">
                  Your sender email and Gmail app password are not set yet.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Go to <Link href="/profile" className="text-indigo-600 hover:text-indigo-800 underline">Profile settings</Link> to configure them once.
                </p>
              </div>
            )}
          </div>

          <p className="text-gray-500 mt-4">
            Top experts matched for this candidate
          </p>
        </div>
        <button
          onClick={handleSendEmails}
          disabled={sendingAlert || selectedExperts.length === 0}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium shadow flex items-center gap-2 transition-all disabled:opacity-50"
        >
          {sendingAlert ? (
             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Mail className="w-4 h-4" />
          )}
          Send Invites ({selectedExperts.length})
        </button>
      </div>

      {/* Candidate Keywords (Word Cloud concept text) */}
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-indigo-900 mb-3 flex items-center gap-2">
          <BadgeCheck className="w-4 h-4" />
          Candidate Extracted Signature (TF-IDF Vector Base)
        </h3>
        <div className="flex flex-wrap gap-2">
          {data.candidate?.keywords?.map((kw, idx) => (
             <span key={idx} className="bg-white border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-xs shadow-sm font-medium">
               {kw}
             </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.topMatches.map((match, index) => {
          if (!match || !match.expert) return null;
          
          const isSelected = selectedExperts.find((e) => e && e._id === match.expert._id);
          const scorePercent = Math.round(match.finalScore * 100);

          return (
            <div 
              key={match.expert._id}
              className={`relative bg-white border ${isSelected ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-md' : 'border-gray-200 shadow-sm'} rounded-xl p-6 cursor-pointer transition-all hover:shadow-md group`}
              onClick={() => toggleExpert(match.expert)}
            >
              {isSelected && (
                <div className="absolute -top-2 -right-2 bg-white rounded-full">
                  <CheckCircle2 className="w-6 h-6 text-indigo-600 fill-indigo-50" />
                </div>
              )}

              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Rank #{index + 1}</div>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">{match.expert.name}</h3>
                  <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                     <Users className="w-3.5 h-3.5" />
                     {match.expert.experienceYears} Yrs Exp.
                  </div>
                </div>
                <div className="flex flex-col items-end">
                   <div className="text-2xl font-black text-indigo-600">{scorePercent}%</div>
                   <div className="text-[10px] text-gray-400">Match Score</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                <div 
                  className={`h-2 rounded-full ${scorePercent > 70 ? 'bg-emerald-500' : scorePercent > 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${scorePercent}%` }}
                ></div>
              </div>

              {/* Match Explanation */}
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-2">Intersecting Expertise:</div>
                <div className="flex flex-wrap gap-1">
                  {match.matchedKeywords && match.matchedKeywords.length > 0 ? (
                    match.matchedKeywords.slice(0, 5).map((kw, i) => (
                      <span key={i} className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] border border-emerald-100">
                        {kw}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">General experience matched.</span>
                  )}
                  {match.matchedKeywords && match.matchedKeywords.length > 5 && (
                    <span className="text-[10px] text-gray-400 py-0.5">+{match.matchedKeywords.length - 5} more</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {data.topMatches.length === 0 && (
          <div className="col-span-full p-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            No experts available for matching.
          </div>
        )}
      </div>
    </div>
  );
}
