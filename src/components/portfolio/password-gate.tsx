"use client";

import { Lock } from "lucide-react";
import { useState } from "react";

interface PasswordGateProps {
  portfolioId: string;
  title: string;
}

export function PasswordGate({ portfolioId, title }: PasswordGateProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/public/verify-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolioId, password }),
      });

      if (res.ok) {
        // Reload to re-render the server component with the cookie set
        window.location.reload();
      } else {
        const data = await res.json();
        setError(data.error || "Incorrect password");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f172a] px-6">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
          <Lock className="h-7 w-7 text-white/40" />
        </div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        <p className="mt-2 text-sm text-white/50">
          This portfolio is password protected. Enter the password to view it.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="h-11 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-cyan-500"
            autoFocus
          />
          {error && (
            <p className="text-sm text-rose-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            className="h-11 w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Verifying..." : "View Portfolio"}
          </button>
        </form>
      </div>
    </div>
  );
}
