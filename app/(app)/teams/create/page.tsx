"use client";

// app/(app)/teams/create/page.tsx
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function CreateTeamPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [season, setSeason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const n = name.trim();
    const s = season.trim();

    if (!n) return setError("Team name is required.");
    if (!s) return setError("Season is required.");

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("teams")
        .insert([{ name: n, season: s }])
        .select("id")
        .single();

      if (error) throw error;
      if (!data?.id) throw new Error("Team created but no id returned.");

      router.push(`/teams/${data.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Failed to create team.");
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 950, margin: 0 }}>
            Create Team
          </h1>
          <div style={{ opacity: 0.85, marginTop: 6 }}>
            Create a team, then schedule games and tag events.
          </div>
        </div>

        <Link href="/teams" style={secondaryLink}>
          Back to Teams
        </Link>
      </div>

      <form
        onSubmit={onSubmit}
        style={{
          marginTop: 16,
          display: "grid",
          gap: 12,
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 14,
          padding: 16,
        }}
      >
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 900 }}>Team name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="2016 Boys White"
            style={inputStyle}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 900 }}>Season</span>
          <input
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            placeholder="Spring 2026"
            style={inputStyle}
          />
        </label>

        {error && <div style={{ color: "#ff6666", fontWeight: 950 }}>{error}</div>}

        <button type="submit" disabled={loading} style={primaryBtn}>
          {loading ? "Creating..." : "Create Team"}
        </button>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: 10,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "transparent",
  color: "inherit",
};

const primaryBtn: React.CSSProperties = {
  padding: 12,
  borderRadius: 12,
  fontWeight: 950,
  cursor: "pointer",
  border: "1px solid rgba(255,255,255,0.2)",
};

const secondaryLink: React.CSSProperties = {
  alignSelf: "center",
  padding: "10px 12px",
  borderRadius: 12,
  fontWeight: 900,
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,0.2)",
  color: "inherit",
};