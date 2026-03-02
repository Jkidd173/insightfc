"use client";

// app/(app)/teams/page.tsx
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Team = {
  id: string;
  name: string;
  season: string;
  created_at?: string;
};

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadTeams() {
    setError(null);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("teams")
        .select("id,name,season,created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTeams((data ?? []) as Team[]);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load teams.");
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTeams();
  }, []);

  const content = useMemo(() => {
    if (loading) return <div style={{ opacity: 0.85 }}>Loading teams...</div>;

    if (error)
      return (
        <div style={{ color: "#ff6666", fontWeight: 900 }}>
          {error}{" "}
          <button
            onClick={loadTeams}
            style={{
              marginLeft: 10,
              padding: "6px 10px",
              borderRadius: 10,
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      );

    if (teams.length === 0)
      return (
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 14,
            padding: 16,
            marginTop: 12,
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 6 }}>No teams yet.</div>
          <div style={{ opacity: 0.85, marginBottom: 12 }}>
            Create a team to start scheduling games and tagging.
          </div>
          <Link href="/teams/create" style={primaryBtn}>
            Create your first team
          </Link>
        </div>
      );

    return (
      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        {teams.map((t) => (
          <Link
            key={t.id}
            href={`/teams/${t.id}`}
            style={{
              textDecoration: "none",
              color: "inherit",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 14,
              padding: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontWeight: 950, fontSize: 18 }}>{t.name}</div>
              <div style={{ opacity: 0.8 }}>{t.season}</div>
            </div>

            <div style={{ opacity: 0.7, fontWeight: 900 }}>Open →</div>
          </Link>
        ))}
      </div>
    );
  }, [teams, loading, error]);

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 950, margin: 0 }}>Teams</h1>
          <div style={{ opacity: 0.85 }}>
            Your teams, schedules, tagging, and stats.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={loadTeams} style={secondaryBtn}>
            Refresh
          </button>
          <Link href="/teams/create" style={primaryBtn}>
            + Create Team
          </Link>
        </div>
      </div>

      {content}
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  fontWeight: 950,
  textDecoration: "none",
  display: "inline-block",
  border: "1px solid rgba(255,255,255,0.2)",
};

const secondaryBtn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  fontWeight: 900,
  cursor: "pointer",
  border: "1px solid rgba(255,255,255,0.2)",
  background: "transparent",
  color: "inherit",
};