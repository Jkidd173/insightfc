"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type GameRow = {
  id: string;
  team_id: string;
  status: string;
  type: string | null;
  date: string | null;
  time: string | null;
  opponent: string | null;
  location: string | null;
  home_away: string | null;
  created_at?: string | null;
};

export default function InProgressPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = (params?.teamId as string | undefined) ?? "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [games, setGames] = useState<GameRow[]>([]);

  async function loadInProgressGames() {
    if (!teamId) return;

    setError(null);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("games")
        .select("id,team_id,status,type,date,time,opponent,location,home_away,created_at")
        .eq("team_id", teamId)
        .eq("status", "in_progress")
        .order("date", { ascending: true })
        .order("time", { ascending: true });

      if (error) throw error;
      setGames((data ?? []) as GameRow[]);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load in-progress games.");
      setGames([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInProgressGames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  async function resumeTagging(gameId: string) {
    router.push(`/games/${gameId}/tag`);
    router.refresh();
  }

  async function markCompleted(gameId: string) {
    const ok = window.confirm("Mark this game as completed?");
    if (!ok) return;

    setError(null);
    try {
      const { error } = await supabase
        .from("games")
        .update({ status: "completed" })
        .eq("id", gameId);

      if (error) throw error;

      await loadInProgressGames();
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed to mark completed.");
    }
  }

  async function deleteGame(gameId: string) {
    const ok = window.confirm("Delete this game? (This cannot be undone.)");
    if (!ok) return;

    setError(null);
    try {
      const { error } = await supabase.from("games").delete().eq("id", gameId);
      if (error) throw error;

      await loadInProgressGames();
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete game.");
    }
  }

  const list = useMemo(() => {
    if (loading) return <div style={{ opacity: 0.85 }}>Loading in-progress games…</div>;

    if (games.length === 0) {
      return <div style={{ opacity: 0.85 }}>No games in progress.</div>;
    }

    return (
      <div style={{ display: "grid", gap: 10 }}>
        {games.map((g) => (
          <div
            key={g.id}
            style={{
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 14,
              padding: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ fontWeight: 950, fontSize: 16 }}>
                {g.date ?? "—"} {g.time ? `@ ${g.time}` : ""} — {g.opponent ?? "Opponent"}
              </div>
              <div style={{ opacity: 0.85 }}>
                {g.type ? g.type.toUpperCase() : "GAME"}{" "}
                {g.home_away ? `• ${g.home_away}` : ""}{" "}
                {g.location ? `• ${g.location}` : ""}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button onClick={() => resumeTagging(g.id)} style={primaryBtn}>
                Resume Tagging
              </button>
              <button onClick={() => markCompleted(g.id)} style={secondaryBtn}>
                Mark Completed
              </button>
              <button onClick={() => deleteGame(g.id)} style={dangerBtn}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }, [games, loading]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 950, margin: 0 }}>In Progress</h1>
          <div style={{ opacity: 0.85, marginTop: 6 }}>
            Games you started tagging but haven’t completed yet.
          </div>
        </div>

        <button onClick={loadInProgressGames} style={secondaryBtn}>
          Refresh
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 12, color: "#ff6666", fontWeight: 950 }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: 16 }}>{list}</div>
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  fontWeight: 950,
  cursor: "pointer",
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(255,255,255,0.06)",
  color: "inherit",
};

const secondaryBtn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  fontWeight: 950,
  cursor: "pointer",
  border: "1px solid rgba(255,255,255,0.2)",
  background: "transparent",
  color: "inherit",
};

const dangerBtn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  fontWeight: 950,
  cursor: "pointer",
  border: "1px solid rgba(255,255,255,0.2)",
  background: "transparent",
  color: "inherit",
};