"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = supabaseBrowser();

  const [mode, setMode] = useState<AuthMode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [invitePassword, setInvitePassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const nextPath = searchParams.get("next") || "/";

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
    setSuccess("");
    setPassword("");
    setConfirmPassword("");
    setInvitePassword("");
  }

  async function handleLogin(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    const { error } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.replace(nextPath);
    router.refresh();
  }

  async function handleSignup(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    if (password.length < 6) {
      setError(
        "Your account password must be at least 6 characters."
      );
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Your account passwords do not match.");
      setLoading(false);
      return;
    }

    if (!invitePassword.trim()) {
      setError("Enter the private invite password.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          invitePassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data?.error ||
            "Unable to create your account."
        );
        setLoading(false);
        return;
      }

      if (data.needsEmailConfirmation) {
        setSuccess(
          data.message ||
            "Account created. Check your email to confirm your account, then sign in."
        );

        setPassword("");
        setConfirmPassword("");
        setInvitePassword("");
        setLoading(false);
        return;
      }

      /*
        Supabase may return a session immediately when
        email confirmation is disabled. Because signup
        happened server-side, we sign in here so the
        browser receives the normal Supabase session.
      */
      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        setSuccess(
          "Account created successfully. Switch to Sign In and enter your new account details."
        );

        setPassword("");
        setConfirmPassword("");
        setInvitePassword("");
        setLoading(false);
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch {
      setError(
        "Something went wrong while creating your account."
      );
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050607] text-white">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-white/[0.035] blur-3xl" />
        <div className="absolute -bottom-40 -right-24 h-[500px] w-[500px] rounded-full bg-white/[0.025] blur-3xl" />
      </div>

      {/* Tactical soccer field */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 py-8 opacity-80 sm:px-10">
        <div className="relative h-[88vh] max-h-[900px] min-h-[620px] w-full max-w-[1400px] overflow-hidden rounded-[36px] border border-white/[0.08] bg-gradient-to-br from-[#151719] via-[#0e1012] to-[#08090a] shadow-2xl">
          {/* Pitch stripes */}
          <div className="absolute inset-0 opacity-[0.13]">
            <div className="grid h-full grid-cols-8">
              {Array.from({ length: 8 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className={
                      index % 2 === 0
                        ? "bg-white/[0.055]"
                        : "bg-transparent"
                    }
                  />
                )
              )}
            </div>
          </div>

          {/* Pitch markings */}
          <div className="absolute inset-[6%] rounded-sm border-2 border-white/[0.13]">
            <div className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-white/[0.13]" />

            <div className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/[0.13] sm:h-56 sm:w-56" />

            <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.16]" />

            <div className="absolute -left-[2px] top-1/2 h-[52%] w-[16%] -translate-y-1/2 border-2 border-l-0 border-white/[0.13]" />

            <div className="absolute -left-[2px] top-1/2 h-[25%] w-[7%] -translate-y-1/2 border-2 border-l-0 border-white/[0.13]" />

            <div className="absolute -right-[2px] top-1/2 h-[52%] w-[16%] -translate-y-1/2 border-2 border-r-0 border-white/[0.13]" />

            <div className="absolute -right-[2px] top-1/2 h-[25%] w-[7%] -translate-y-1/2 border-2 border-r-0 border-white/[0.13]" />

            <div className="absolute -left-[2.7%] top-1/2 h-[18%] w-[2.7%] -translate-y-1/2 border-2 border-r-0 border-white/[0.11]" />

            <div className="absolute -right-[2.7%] top-1/2 h-[18%] w-[2.7%] -translate-y-1/2 border-2 border-l-0 border-white/[0.11]" />
          </div>

          {/* Tactical movement lines */}
          <svg
            className="absolute inset-0 h-full w-full opacity-40"
            viewBox="0 0 1400 900"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <marker
                id="arrowBlue"
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="3"
                orient="auto"
              >
                <path
                  d="M0,0 L0,6 L7,3 z"
                  fill="#3b82f6"
                />
              </marker>

              <marker
                id="arrowRed"
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="3"
                orient="auto"
              >
                <path
                  d="M0,0 L0,6 L7,3 z"
                  fill="#ef4444"
                />
              </marker>
            </defs>

            <path
              d="M210 290 C330 235 400 250 515 330"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeDasharray="10 12"
              markerEnd="url(#arrowBlue)"
            />

            <path
              d="M1130 610 C1010 655 940 635 850 560"
              stroke="#ef4444"
              strokeWidth="3"
              strokeDasharray="10 12"
              markerEnd="url(#arrowRed)"
            />

            <path
              d="M300 665 C425 590 470 560 590 545"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeDasharray="10 12"
              markerEnd="url(#arrowBlue)"
            />

            <path
              d="M1090 270 C970 315 920 330 830 390"
              stroke="#ef4444"
              strokeWidth="3"
              strokeDasharray="10 12"
              markerEnd="url(#arrowRed)"
            />
          </svg>

          {/* Blue X team */}
          <TacticalX className="left-[12%] top-[48%]" />
          <TacticalX className="left-[22%] top-[25%]" />
          <TacticalX className="left-[24%] top-[70%]" />
          <TacticalX className="left-[37%] top-[39%]" />
          <TacticalX className="left-[39%] top-[65%]" />
          <TacticalX className="left-[46%] top-[18%]" />

          {/* Red O team */}
          <TacticalO className="right-[12%] top-[48%]" />
          <TacticalO className="right-[22%] top-[25%]" />
          <TacticalO className="right-[24%] top-[70%]" />
          <TacticalO className="right-[37%] top-[39%]" />
          <TacticalO className="right-[39%] top-[65%]" />
          <TacticalO className="right-[46%] top-[18%]" />

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.55)_100%)]" />
        </div>
      </div>

      {/* Brand */}
      <div className="absolute left-6 top-6 z-20 flex items-center gap-3 sm:left-10 sm:top-8">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-yellow-400 text-sm font-black tracking-tight text-black shadow-lg shadow-yellow-400/10">
          IFC
        </div>

        <div>
          <div className="text-sm font-black tracking-wide text-white">
            InsightFC
          </div>

          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Youth Performance
          </div>
        </div>
      </div>

      {/* Auth area */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-24">
        <div className="w-full max-w-[430px]">
          <div className="rounded-[28px] border border-white/[0.12] bg-black/75 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:p-8">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-2xl border border-yellow-400/20 bg-yellow-400/10 text-lg font-black text-yellow-400">
                IFC
              </div>

              <div className="text-xs font-bold uppercase tracking-[0.22em] text-yellow-400">
                Coach Workspace
              </div>

              <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
                {mode === "login"
                  ? "Welcome back"
                  : "Join InsightFC"}
              </h1>

              <p className="mt-2 text-sm leading-6 text-zinc-400">
                {mode === "login"
                  ? "Sign in to access your teams, matches, players, and InsightFC analysis."
                  : "Private testing is invite-only. Create your coach account using your invite password."}
              </p>
            </div>

            {/* Login / Signup switch */}
            <div className="mb-6 grid grid-cols-2 rounded-xl border border-white/[0.1] bg-white/[0.035] p-1">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={`rounded-lg px-3 py-2.5 text-sm font-bold transition ${
                  mode === "login"
                    ? "bg-yellow-400 text-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`rounded-lg px-3 py-2.5 text-sm font-bold transition ${
                  mode === "signup"
                    ? "bg-yellow-400 text-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Create Account
              </button>
            </div>

            {error ? (
              <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="mb-5 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm leading-6 text-green-200">
                {success}
              </div>
            ) : null}

            {mode === "login" ? (
              <form
                onSubmit={handleLogin}
                className="space-y-5"
              >
                <EmailField
                  email={email}
                  setEmail={setEmail}
                />

                <div>
                  <label
                    htmlFor="login-password"
                    className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-zinc-400"
                  >
                    Password
                  </label>

                  <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/[0.055] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-yellow-400/60 focus:bg-white/[0.075] focus:ring-2 focus:ring-yellow-400/10"
                    placeholder="Enter your password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-yellow-400 px-5 py-3.5 text-sm font-black text-black shadow-lg shadow-yellow-400/10 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Signing in..."
                    : "Sign In →"}
                </button>
              </form>
            ) : (
              <form
                onSubmit={handleSignup}
                className="space-y-4"
              >
                <EmailField
                  email={email}
                  setEmail={setEmail}
                />

                <div>
                  <label
                    htmlFor="signup-password"
                    className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-zinc-400"
                  >
                    Create Password
                  </label>

                  <input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/[0.055] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-yellow-400/60 focus:bg-white/[0.075] focus:ring-2 focus:ring-yellow-400/10"
                    placeholder="Choose your own password"
                  />

                  <p className="mt-1.5 text-[11px] text-zinc-600">
                    This will be your personal InsightFC
                    login password.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-zinc-400"
                  >
                    Confirm Password
                  </label>

                  <input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/[0.055] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-yellow-400/60 focus:bg-white/[0.075] focus:ring-2 focus:ring-yellow-400/10"
                    placeholder="Enter it again"
                  />
                </div>

                <div>
                  <label
                    htmlFor="invite-password"
                    className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-zinc-400"
                  >
                    Invite Password
                  </label>

                  <input
                    id="invite-password"
                    type="password"
                    autoComplete="off"
                    required
                    value={invitePassword}
                    onChange={(e) =>
                      setInvitePassword(e.target.value)
                    }
                    className="w-full rounded-xl border border-yellow-400/25 bg-yellow-400/[0.055] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-yellow-400/70 focus:ring-2 focus:ring-yellow-400/10"
                    placeholder="Enter your private invite password"
                  />

                  <p className="mt-1.5 text-[11px] leading-5 text-zinc-500">
                    InsightFC is currently in private
                    testing. An invite password is required
                    to create an account.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-yellow-400 px-5 py-3.5 text-sm font-black text-black shadow-lg shadow-yellow-400/10 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Creating account..."
                    : "Create Account →"}
                </button>
              </form>
            )}

            <div className="mt-6 border-t border-white/[0.08] pt-5 text-center">
              <p className="text-xs text-zinc-500">
                Match insight built for developing players.
              </p>
            </div>
          </div>

          <div className="mt-5 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
            Clear stats · Better conversations
          </div>
        </div>
      </div>
    </main>
  );
}

function EmailField({
  email,
  setEmail,
}: {
  email: string;
  setEmail: (value: string) => void;
}) {
  return (
    <div>
      <label
        htmlFor="email"
        className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-zinc-400"
      >
        Email
      </label>

      <input
        id="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-white/[0.055] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-yellow-400/60 focus:bg-white/[0.075] focus:ring-2 focus:ring-yellow-400/10"
        placeholder="coach@example.com"
      />
    </div>
  );
}

function TacticalX({
  className,
}: {
  className: string;
}) {
  return (
    <div
      className={`absolute hidden h-12 w-12 items-center justify-center sm:flex ${className}`}
    >
      <div className="absolute h-[4px] w-11 rotate-45 rounded-full bg-blue-500/75 shadow-[0_0_20px_rgba(59,130,246,0.35)]" />

      <div className="absolute h-[4px] w-11 -rotate-45 rounded-full bg-blue-500/75 shadow-[0_0_20px_rgba(59,130,246,0.35)]" />
    </div>
  );
}

function TacticalO({
  className,
}: {
  className: string;
}) {
  return (
    <div
      className={`absolute hidden h-11 w-11 rounded-full border-[4px] border-red-500/75 shadow-[0_0_20px_rgba(239,68,68,0.25)] sm:block ${className}`}
    />
  );
}
