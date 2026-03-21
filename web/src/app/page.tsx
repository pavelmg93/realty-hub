"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HomePage() {
  const { user, isLoading, login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard/feed");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-base)" }}>
        <div className="animate-pulse text-[var(--text-muted)]">Loading...</div>
      </div>
    );
  }

  if (user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      router.push("/dashboard/feed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Branding section */}
      <div className="px-8 py-12 lg:w-2/5 lg:min-h-screen flex flex-col justify-center" style={{ backgroundColor: "var(--bg-base)" }}>
        <div className="max-w-sm mx-auto lg:mx-0">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Realty Hub</h1>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed">
            Nha Trang Real Estate Agent Platform
          </p>
          <div className="mt-8 hidden lg:block">
            <div className="flex items-center gap-3 text-[var(--text-muted)] text-sm mb-3">
              <svg className="w-5 h-5 shrink-0 text-[var(--orange)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Manage your property listings
            </div>
            <div className="flex items-center gap-3 text-[var(--text-muted)] text-sm mb-3">
              <svg className="w-5 h-5 shrink-0 text-[var(--orange)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Browse the feed with map view
            </div>
            <div className="flex items-center gap-3 text-[var(--text-muted)] text-sm">
              <svg className="w-5 h-5 shrink-0 text-[var(--orange)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Message other agents directly
            </div>
          </div>
        </div>
      </div>

      {/* Login form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12" style={{ backgroundColor: "var(--bg-surface)" }}>
        <div className="w-full max-w-sm">
          <div className="rounded-xl border border-[var(--border)] p-6" style={{ backgroundColor: "var(--bg-elevated)" }}>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6 text-center">
              Log In
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--orange)]"
                  required
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--orange)]"
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && <p className="text-[var(--error)] text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
                style={{ backgroundColor: "var(--orange)" }}
              >
                {loading ? "Logging in..." : "Log In"}
              </button>
            </form>

            <p className="text-xs text-[var(--text-muted)] text-center mt-4">
              Contact your admin to get an account
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
