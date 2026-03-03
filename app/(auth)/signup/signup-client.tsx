"use client";

import React, { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

type Role = "coach" | "player";

export default function SignupClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const inviteToken = searchParams?.get("inviteToken") || "";
  const [role, setRole] = useState<Role>(inviteToken ? "player" : "coach");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = useMemo(() => supabaseBrowser(), []);

  const inputClass =
    "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white placeholder:text-zinc-500 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30";

  const selectClass =
    "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30";

  const primaryBtn =
    "w-full rounded-lg bg-yellow-400 px-4 py-2 font-bold text-black hover:bg-yellow-300 active:bg-yellow-400 disabled:opacity-60";

  const linkClass =
    "text-yellow-400 hover:text-yellow-300 underline underline-offset-4";

  function Logo() {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
          <svg width="38" height="38" viewBox="0 0 48 48" aria-hidden="true">
            <path d="M24 4 L42 14 V34 L24 44 L6 34 V14 Z" fill="#FACC15" />
            <path
              d="M16 24h16"
              stroke="#0A0A0A"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
          <div className="text-2xl font-extrabold tracking-tight text-yellow-400">
            InsightFC
          </div>
        </div>
        <div className="text-sm text-zinc-400">
          Film + tagging for coaches & players
        </div>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const finalRole: Role = inviteToken ? "player" : role;

    if (!email.trim() || !password) {
      setMessage("Please enter your email and password.");
      return;
    }
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          // We store role and inviteToken in metadata for now.
          // Later we’ll move invite acceptance into a server API route.
          data: {
            role: finalRole,
            inviteToken: inviteToken || null,
          },
        },
      });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      // Many Supabase setups require email confirmation.
      // We’ll send them to login with a friendly message.
      router.replace("/login");
    } catch (err: any) {
      setMessage(err?.message || "Signup failed. Please try again.");
      setLoading(false);
      return;
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-lg">
        <Logo />

        <h1 className="mt-6 text-xl font-bold text-white">Create account</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {inviteToken
            ? "You were invited as a player. Finish creating your account."
            : "Create your InsightFC account to get started."}
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {!inviteToken ? (
            <div className="space-y-2">
              <label className="text-sm text-zinc-300">Role</label>
              <select
                className={selectClass}
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                <option value="coach">Coach</option>
                <option value="player">Player</option>
              </select>
            </div>
          ) : (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-200">
              Role: <span className="font-semibold">Player</span> (forced by
              invite)
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm text-zinc-300">Email</label>
            <input
              className={inputClass}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-zinc-300">Password</label>
            <input
              className={inputClass}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>

          {message ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-200">
              {message}
            </div>
          ) : null}

          <button type="submit" className={primaryBtn} disabled={loading}>
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        <div className="mt-6 text-sm text-zinc-400">
          Already have an account?{" "}
          <a className={linkClass} href="/login">
            Log in
          </a>
        </div>
      </div>
    </div>
  );
}