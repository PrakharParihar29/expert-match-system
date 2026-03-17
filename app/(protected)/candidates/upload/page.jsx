"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UploadCloud, FileText, CheckCircle } from "lucide-react";

export default function UploadCandidatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a resume file (PDF or DOCX).");
      return;
    }
    
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("resume", file);

    try {
      const res = await fetch("/api/candidates/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/candidates");
        }, 1500);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("An unexpected error occurred during upload.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link href="/candidates" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Upload Candidate Resume</h1>
          <p className="text-gray-500 text-sm">Our AI will automatically extract expertise keywords.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 shadow-sm rounded-xl p-6 sm:p-8 space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
            {error}
          </div>
        )}
        
        {success && (
          <div className="p-4 bg-emerald-50 text-emerald-700 rounded-lg text-sm border border-emerald-100 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Resume processed successfully! Keywords extracted. Redirecting...
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              placeholder="Alice Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              placeholder="alice@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium text-gray-700">Resume File</label>
            <div className={`mt-2 flex justify-center rounded-xl border border-dashed border-gray-300 px-6 py-10 transition-colors ${file ? 'bg-emerald-50/50 border-emerald-200' : 'bg-gray-50'}`}>
              <div className="text-center">
                {file ? (
                  <FileText className="mx-auto h-12 w-12 text-emerald-500" aria-hidden="true" />
                ) : (
                  <UploadCloud className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
                )}
                <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer rounded-md bg-transparent font-semibold text-emerald-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-emerald-600 focus-within:ring-offset-2 hover:text-emerald-500"
                  >
                    <span>{file ? "Change file" : "Upload a file"}</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.doc,.docx" />
                  </label>
                  <p className="pl-1 text-gray-500">{file ? "" : "or drag and drop"}</p>
                </div>
                <p className="text-xs leading-5 text-gray-500 mt-2">
                  {file ? file.name : "PDF or DOCX up to 10MB"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors mr-3"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !file}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium shadow flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4" />
            {loading ? "Processing..." : "Extract & Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
