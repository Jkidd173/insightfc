"use client";

import React, { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

type Role = "coach" | "player";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const inviteToken = useMemo(() => searchParams.get("invite"), [searchParams]);

  // If invite exists, force player role
  const [role, setRole] = useState<Role>(inviteToken ? "player" : "coach");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = supabaseBrowser();

      const chosenRole: Role = inviteToken ? "player" : role;

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: chosenRole,
            full_name: fullName,
          },
        },
      });

      if (signUpError) throw signUpError;

      // If they came from an invite, send them to accept page next
      if (inviteToken) {
        router.push(`/accept-invite/${inviteToken}`);
        return;
      }

      router.push("/");
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: "0 16px" }}>
      <h1 style={{ marginBottom: 8 }}>Sign Up</h1>

      {inviteToken ? (
        <p style={{ marginTop: 0 }}>
          You’re joining a team via invite. Your account will be created as a{" "}
          <b>player</b>.
        </p>
      ) : (
        <div style={{ display: "flex", gap: 10, margin: "16px 0" }}>
          <button
            type="button"
            onClick={() => setRole("coach")}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 8,
              border: role === "coach" ? "2px solid #000" : "1px solid #ccc",
              fontWeight: role === "coach" ? 700 : 500,
            }}
          >
            Coach
          </button>
          <button
            type="button"
            onClick={() => setRole("player")}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 8,
              border: role === "player" ? "2px solid #000" : "1px solid #ccc",
              fontWeight: role === "player" ? 700 : 500,
            }}
          >
            Player
          </button>
        </div>
      )}

      <form onSubmit={onSignup} style={{ display: "grid", gap: 10 }}>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Full name"
          autoComplete="name"
        />

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          autoComplete="email"
          required
        />

        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          autoComplete="new-password"
          required
        />

        {error && (
          <div style={{ color: "red", fontSize: 14, lineHeight: 1.3 }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 12,
            borderRadius: 8,
            border: "1px solid #000",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>

      <p style={{ marginTop: 14 }}>
        Already have an account? <a href="/login">Log in</a>
      </p>
    </div>
  );
}