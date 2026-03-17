"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, MoreVertical, Trash2 } from "lucide-react";

export default function ExpertsPage() {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchExperts();
  }, []);

  const fetchExperts = async () => {
    try {
      const res = await fetch("/api/experts");
      const data = await res.json();
      setExperts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteExpert = async (id) => {
    if (!confirm("Are you sure you want to delete this expert?")) return;
    try {
      const res = await fetch(`/api/experts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setExperts((prev) => prev.filter((e) => e._id !== id));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const filteredExperts = experts.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.expertiseKeywords.some((k) => k.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Experts Directory</h1>
          <p className="text-gray-500 mt-1">Manage interview board experts and their expertise areas.</p>
        </div>
        <Link
          href="/experts/add"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Expert
        </Link>
      </div>

      <div className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search experts or keywords..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Experience (Years)</th>
                  <th className="px-6 py-4">Expertise Keywords</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredExperts.length > 0 ? (
                  filteredExperts.map((expert) => (
                    <tr key={expert._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{expert.name}</div>
                        <div className="text-gray-500 text-xs">{expert.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {expert.experienceYears} Years
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5 max-w-[300px] overflow-hidden">
                          {expert.expertiseKeywords.slice(0, 3).map((kw, idx) => (
                            <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                              {kw}
                            </span>
                          ))}
                          {expert.expertiseKeywords.length > 3 && (
                            <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs">
                              +{expert.expertiseKeywords.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => deleteExpert(expert._id)}
                          className="text-red-500 hover:text-red-700 p-2 rounded-md hover:bg-red-50 transition-colors inline-block"
                          title="Delete Expert"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-12 text-gray-500">
                      No experts found matching your criteria.
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
