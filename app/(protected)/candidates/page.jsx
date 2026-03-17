"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Trash2, FileText, Bot } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const res = await fetch("/api/candidates");
      const data = await res.json();
      setCandidates(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCandidate = async (id) => {
    if (!confirm("Are you sure you want to delete this candidate?")) return;
    try {
      const res = await fetch(`/api/candidates/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCandidates((prev) => prev.filter((c) => c._id !== id));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const filteredCandidates = candidates.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Candidates</h1>
          <p className="text-gray-500 mt-1">Review applicant profiles and extracted resume keywords.</p>
        </div>
        <Link
          href="/candidates/upload"
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium shadow flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Upload Resume
        </Link>
      </div>

      <div className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search candidates by name or email..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Candidate Information</th>
                  <th className="px-6 py-4">Resume</th>
                  <th className="px-6 py-4">Extracted Keywords</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCandidates.length > 0 ? (
                  filteredCandidates.map((candidate) => (
                    <tr key={candidate._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{candidate.name}</div>
                        <div className="text-gray-500 text-xs">{candidate.email}</div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-2 text-indigo-600 text-xs font-medium">
                           <FileText className="w-4 h-4" />
                           Parsed successfully
                         </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5 max-w-[300px] overflow-hidden">
                          {candidate.keywords.slice(0, 4).map((kw, idx) => (
                            <span key={idx} className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs border border-emerald-100">
                              {kw}
                            </span>
                          ))}
                          {candidate.keywords.length > 4 && (
                            <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs">
                              +{candidate.keywords.length - 4}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => router.push(`/matching?candidateId=${candidate._id}`)}
                            className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
                            title="Find Matching Experts"
                          >
                            <Bot className="w-3.5 h-3.5" />
                            Match
                          </button>
                          <button 
                            onClick={() => deleteCandidate(candidate._id)}
                            className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                            title="Delete Candidate"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-12 text-gray-500">
                      No candidates found. Upload a resume to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
