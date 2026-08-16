"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Incorrect email or password.");
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Incorrect email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 h-10 w-10 rounded-lg bg-navy" />
          <h1 className="text-xl font-semibold text-navy">Client Portal</h1>
          <p className="mt-1 text-sm text-ink/60">Sign in to your account</p>
        </div>

        <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="focus-ring w-full rounded-lg border border-border px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="focus-ring w-full rounded-lg border border-border px-3 py-2 text-sm outline-none"
              />
              <p className="mt-1 text-xs text-ink/50">
                First time here? Just choose a password (8+ characters) — it'll be set up as your account password automatically.
              </p>
            </div>
            {error && <p className="text-sm text-rose">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="focus-ring w-full rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white transition hover:bg-navy-light disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
