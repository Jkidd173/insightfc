"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Team = {
  id: string;
  name: string;
  season: string;
};

export default function TeamHomePage() {
  const params = useParams();
  const teamId = (params?.teamId as string | undefined) ?? "";

  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadTeam() {
    setError(null);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("teams")
        .select("id,name,season")
        .eq("id", teamId)
        .single();

      if (error) throw error;
      setTeam(data as Team);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load team.");
      setTeam(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!teamId) return;
    loadTeam();
  }, [teamId]);

  if (!teamId) {
    return <div style={{ padding: 24 }}>Missing team id.</div>;
  }

  if (loading) {
    return <div style={{ padding: 24, opacity: 0.85 }}>Loading team…</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ color: "#ff6666", fontWeight: 950 }}>{error}</div>
        <button
          onClick={loadTeam}
          style={{
            marginTop: 12,
            padding: "10px 14px",
            borderRadius: 12,
            fontWeight: 900,
            cursor: "pointer",
            border: "1px solid rgba(255,255,255,0.2)",
            background: "transparent",
            color: "inherit",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!team) {
    return <div style={{ padding: 24 }}>Team not found.</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: 34, fontWeight: 950, margin: 0 }}>{team.name}</h1>
      <div style={{ opacity: 0.85, marginTop: 6 }}>{team.season}</div>

      <div
        style={{
          marginTop: 16,
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 14,
          padding: 16,
        }}
      >
        <div style={{ fontWeight: 950, marginBottom: 8 }}>
          Team overview (coming soon)
        </div>
        <div style={{ opacity: 0.85 }}>
          Record, trends, top actions, and player leaders will live here.
        </div>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Link href={`/teams/${teamId}/schedule`} style={btn}>
          Go to Schedule →
        </Link>
        <Link href={`/teams/${teamId}/in-progress`} style={btn}>
          Go to In Progress →
        </Link>
        <Link href={`/teams/${teamId}/completed`} style={btn}>
          Go to Completed →
        </Link>
        <Link href={`/teams/${teamId}/players`} style={btn}>
          Go to Players →
        </Link>
      </div>
    </div>
  );
}

const btn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  fontWeight: 950,
  border: "1px solid rgba(255,255,255,0.18)",
  textDecoration: "none",
  color: "inherit",
};