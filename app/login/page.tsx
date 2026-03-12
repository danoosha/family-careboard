"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Heart } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="min-h-dvh bg-surface flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-16 h-16 rounded-3xl bg-[#EAE8F7] flex items-center justify-center mb-4 shadow-soft">
          <Heart size={30} strokeWidth={2} className="text-[#8B82C4]" />
        </div>
        <h1 className="text-2xl font-extrabold text-heading tracking-tight">
          Family Careboard
        </h1>
        <p className="text-sm text-muted mt-1 text-center">
          Your private family health dashboard
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-card p-6">
        {!sent ? (
          <>
            <h2 className="text-lg font-bold text-heading mb-1">Sign in</h2>
            <p className="text-sm text-muted mb-6">
              We'll send a magic link to your email.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-bold text-muted uppercase tracking-widest mb-1.5"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-medium text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#C9C3E6] transition"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 font-medium">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-3.5 rounded-2xl bg-[#C9C3E6] text-[#3A3370] font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Sending…" : "Send Magic Link"}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">📬</div>
            <h2 className="text-lg font-bold text-heading mb-2">
              Check your inbox
            </h2>
            <p className="text-sm text-muted">
              We sent a magic link to{" "}
              <span className="font-semibold text-body">{email}</span>.
              Tap it to sign in.
            </p>
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              className="mt-6 text-xs text-muted underline underline-offset-2"
            >
              Use a different email
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-muted mt-8 text-center opacity-60">
        Private & secure · Family use only
      </p>
    </div>
  );
}
