"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type GameRow = {
  id: string;
  team_id: string;
  status: string;
  type: string | null;
  date: string | null; // YYYY-MM-DD
  time: string | null; // HH:MM
  opponent: string | null;
  location: string | null;
  home_away: string | null;
  created_at?: string | null;
};

const GAME_TYPES = ["game", "scrimmage", "tournament"] as const;
const HOME_AWAY = ["home", "away", "neutral"] as const;

export default function SchedulePage() {
  const params = useParams();
  const router = useRouter();
  const teamId = (params?.teamId as string | undefined) ?? "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [games, setGames] = useState<GameRow[]>([]);

  // Form state
  const [type, setType] = useState<(typeof GAME_TYPES)[number]>("game");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [opponent, setOpponent] = useState("");
  const [location, setLocation] = useState("");
  const [homeAway, setHomeAway] = useState<(typeof HOME_AWAY)[number]>("away");

  async function loadScheduledGames() {
    if (!teamId) return;
    setError(null);
    setLoading(true);

    try {
      // NOTE: This assumes your table is named "games" and uses:
      // team_id (uuid), status (text), type (text), date (date), time (text), opponent (text), location (text), home_away (text)
      const { data, error } = await supabase
        .from("games")
        .select("id,team_id,status,type,date,time,opponent,location,home_away,created_at")
        .eq("team_id", teamId)
        .eq("status", "scheduled")
        .order("date", { ascending: true })
        .order("time", { ascending: true });

      if (error) throw error;
      setGames((data ?? []) as GameRow[]);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load scheduled games.");
      setGames([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadScheduledGames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  async function createGame(e: React.FormEvent) {
    e.preventDefault();
    if (!teamId) return;

    const opp = opponent.trim();
    const loc = location.trim();

    if (!date) return setError("Date is required.");
    if (!time) return setError("Time is required.");
    if (!opp) return setError("Opponent is required.");

    setError(null);
    setSaving(true);

    try {
      const { data, error } = await supabase
        .from("games")
        .insert([
          {
            team_id: teamId,
            status: "scheduled",
            type,
            date, // should be YYYY-MM-DD
            time, // should be HH:MM
            opponent: opp,
            location: loc || null,
            home_away: homeAway,
          },
        ])
        .select("id")
        .single();

      if (error) throw error;

      // Reset form (keep type/homeAway)
      setDate("");
      setTime("");
      setOpponent("");
      setLocation("");

      // Reload list
      await loadScheduledGames();

      // Optional: if you want to jump to the game right away, you could.
      // For now we just stay on schedule.
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed to create game.");
    } finally {
      setSaving(false);
    }
  }

  async function startTagging(gameId: string) {
    setError(null);
    try {
      // Mark in progress
      const { error } = await supabase
        .from("games")
        .update({ status: "in_progress" })
        .eq("id", gameId);

      if (error) throw error;

      // Go to tagging page
      router.push(`/games/${gameId}/tag`);
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed to start tagging.");
    }
  }

  async function deleteGame(gameId: string) {
    const ok = window.confirm("Delete this scheduled game?");
    if (!ok) return;

    setError(null);
    try {
      const { error } = await supabase.from("games").delete().eq("id", gameId);
      if (error) throw error;
      await loadScheduledGames();
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete game.");
    }
  }

  const list = useMemo(() => {
    if (loading) return <div style={{ opacity: 0.85 }}>Loading scheduled games…</div>;
    if (games.length === 0) return <div style={{ opacity: 0.85 }}>No scheduled games.</div>;

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
              <button onClick={() => startTagging(g.id)} style={primaryBtn}>
                Start Tagging
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
          <h1 style={{ fontSize: 30, fontWeight: 950, margin: 0 }}>Schedule</h1>
          <div style={{ opacity: 0.85, marginTop: 6 }}>
            Add games before they happen. Start tagging when it’s go time.
          </div>
        </div>

        <button onClick={loadScheduledGames} style={secondaryBtn}>
          Refresh
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 12, color: "#ff6666", fontWeight: 950 }}>
          {error}
        </div>
      )}

      {/* Create Game */}
      <div
        style={{
          marginTop: 16,
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 14,
          padding: 16,
        }}
      >
        <div style={{ fontWeight: 950, marginBottom: 10 }}>Create Game</div>

        <form onSubmit={createGame} style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={labelStyle}>Date</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={labelStyle}>Time</span>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={inputStyle} />
            </label>
          </div>

          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={labelStyle}>Type</span>
              <select value={type} onChange={(e) => setType(e.target.value as any)} style={inputStyle}>
                {GAME_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={labelStyle}>Home/Away</span>
              <select value={homeAway} onChange={(e) => setHomeAway(e.target.value as any)} style={inputStyle}>
                {HOME_AWAY.map((ha) => (
                  <option key={ha} value={ha}>
                    {ha.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={labelStyle}>Opponent</span>
            <input
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              placeholder="N. Oakland 16 Black"
              style={inputStyle}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={labelStyle}>Location (optional)</span>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Premier / Indy / Total / etc."
              style={inputStyle}
            />
          </label>

          <button type="submit" disabled={saving} style={primaryBtn}>
            {saving ? "Creating..." : "Create"}
          </button>
        </form>
      </div>

      {/* Scheduled Games */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 950, marginBottom: 10 }}>Scheduled Games</div>
        {list}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontWeight: 900,
  opacity: 0.9,
};

const inputStyle: React.CSSProperties = {
  padding: 10,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "transparent",
  color: "inherit",
};

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
  fontWeight: 900,
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