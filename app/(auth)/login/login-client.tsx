"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const next = searchParams.get("next") || "/hq";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = supabaseBrowser();

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // After login, send them where we want
      router.push(next);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 10 }}>Login</h1>
      <p style={{ opacity: 0.8, marginBottom: 18 }}>
        Sign in to access your teams and tools.
      </p>

      <form onSubmit={onLogin}>
        <label style={{ display: "block", marginBottom: 6 }}>Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="email"
          required
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 10,
            border: "1px solid #333",
            background: "transparent",
            color: "inherit",
            marginBottom: 14,
          }}
        />

        <label style={{ display: "block", marginBottom: 6 }}>Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="current-password"
          required
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 10,
            border: "1px solid #333",
            background: "transparent",
            color: "inherit",
            marginBottom: 14,
          }}
        />

        {error ? (
          <div
            style={{
              marginBottom: 14,
              padding: 10,
              borderRadius: 10,
              border: "1px solid #7f1d1d",
              color: "#fecaca",
              background: "rgba(127, 29, 29, 0.25)",
            }}
          >
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 10,
            border: "1px solid #444",
            fontWeight: 800,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <div style={{ marginTop: 14, opacity: 0.9 }}>
          Don’t have an account?{" "}
          <a href="/signup" style={{ textDecoration: "underline" }}>
            Create one
          </a>
        </div>
      </form>
    </div>
  );
}