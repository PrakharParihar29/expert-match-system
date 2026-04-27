"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ProfilePage() {
  const [senderEmail, setSenderEmail] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/auth/profile")
      .then(async (res) => {
        const payload = await res.json();
        if (!res.ok) {
          setError(payload.message || "Unable to load profile settings.");
        } else {
          setSenderEmail(payload.senderEmail || "");
          setMessage(payload.senderEmail ? "Your saved sender settings are loaded." : "Set your sender email and app password to use one-click email sending.");
        }
      })
      .catch(() => {
        setError("Unable to load profile settings.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);

    const res = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderEmail, senderAppPassword: appPassword }),
    });

    const payload = await res.json();
    if (!res.ok) {
      setError(payload.message || "Failed to save profile settings.");
    } else {
      setMessage("Sender settings saved successfully.");
      setAppPassword("");
    }
    setSaving(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Profile Settings</h1>
            <p className="text-sm text-gray-500">Configure your default sender email and Gmail app password for expert invite emails.</p>
          </div>
          <Link href="/matching" className="text-sm text-indigo-600 hover:text-indigo-800 underline">Back to Matches</Link>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          {loading ? (
            <p className="text-sm text-gray-500">Loading profile settings...</p>
          ) : (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Sender Email</label>
                <input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="your@gmail.com"
                  className="block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Gmail App Password</label>
                <input
                  type="password"
                  value={appPassword}
                  onChange={(e) => setAppPassword(e.target.value)}
                  placeholder="16-character app password"
                  maxLength={19}
                  className="block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                <p className="text-xs text-gray-500">Enter the 16-digit app password from your Google account. This will be saved for future email sends.</p>
              </div>

              <div className="flex flex-col gap-2">
                {message && <p className="text-sm text-emerald-600">{message}</p>}
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button
                  onClick={handleSave}
                  disabled={saving || !senderEmail}
                  className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save Profile Settings"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
