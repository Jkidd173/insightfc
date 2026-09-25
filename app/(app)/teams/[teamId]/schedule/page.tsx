"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

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

const GAME_TYPES = ["game", "scrimmage", "tournament"] as const;
const HOME_AWAY = ["home", "away"] as const;

export default function SchedulePage() {
  const params = useParams();
  const router = useRouter();

  const teamId =
    (params?.teamId as string | undefined) ?? "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [games, setGames] = useState<GameRow[]>([]);

  const [type, setType] =
    useState<(typeof GAME_TYPES)[number]>("game");

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [opponent, setOpponent] = useState("");
  const [location, setLocation] = useState("");

  const [homeAway, setHomeAway] =
    useState<(typeof HOME_AWAY)[number]>("home");

  async function loadScheduledGames() {
    if (!teamId) return;

    setError(null);
    setLoading(true);

    try {
      const supabase = supabaseBrowser();

      const { data, error } = await supabase
        .from("games")
        .select(
          "id,team_id,status,type,date,time,opponent,location,home_away,created_at"
        )
        .eq("team_id", teamId)
        .eq("status", "scheduled")
        .order("date", { ascending: true })
        .order("time", { ascending: true });

      if (error) throw error;

      setGames((data ?? []) as GameRow[]);
    } catch (e: unknown) {
      setError(
        e instanceof Error
          ? e.message
          : "Failed to load scheduled games."
      );

      setGames([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadScheduledGames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  async function createGame(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!teamId) return;

    const opp = opponent.trim();
    const loc = location.trim();

    if (!date) {
      setError("Date is required.");
      return;
    }

    if (!time) {
      setError("Time is required.");
      return;
    }

    if (!opp) {
      setError("Opponent is required.");
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const supabase = supabaseBrowser();

      const { error } = await supabase
        .from("games")
        .insert([
          {
            team_id: teamId,
            status: "scheduled",
            type,
            date,
            time,
            opponent: opp,
            location: loc || null,
            home_away: homeAway,
            team_score: null,
            opponent_score: null,
          },
        ]);

      if (error) throw error;

      setDate("");
      setTime("");
      setOpponent("");
      setLocation("");

      await loadScheduledGames();

      router.refresh();
    } catch (e: unknown) {
      setError(
        e instanceof Error
          ? e.message
          : "Failed to create game."
      );
    } finally {
      setSaving(false);
    }
  }

  function uploadMatch(gameId: string) {
    router.push(
      `/upload?gameId=${encodeURIComponent(gameId)}`
    );
  }

  async function deleteGame(gameId: string) {
    const ok = window.confirm(
      "Delete this scheduled game?"
    );

    if (!ok) return;

    setError(null);

    try {
      const supabase = supabaseBrowser();

      const { error } = await supabase
        .from("games")
        .delete()
        .eq("id", gameId)
        .eq("team_id", teamId)
        .eq("status", "scheduled");

      if (error) throw error;

      await loadScheduledGames();

      router.refresh();
    } catch (e: unknown) {
      setError(
        e instanceof Error
          ? e.message
          : "Failed to delete game."
      );
    }
  }

  const list = useMemo(() => {
    if (loading) {
      return (
        <div style={{ opacity: 0.85 }}>
          Loading scheduled games…
        </div>
      );
    }

    if (games.length === 0) {
      return (
        <div style={{ opacity: 0.85 }}>
          No scheduled games.
        </div>
      );
    }

    return (
      <div
        style={{
          display: "grid",
          gap: 10,
        }}
      >
        {games.map((g) => (
          <div
            key={g.id}
            style={{
              border:
                "1px solid rgba(255,255,255,0.15)",
              borderRadius: 14,
              padding: 14,
              display: "flex",
              alignItems: "center",
              justifyContent:
                "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 950,
                  fontSize: 16,
                }}
              >
                {g.date ?? "—"}{" "}
                {g.time
                  ? `@ ${g.time}`
                  : ""}{" "}
                —{" "}
                {g.opponent ??
                  "Opponent"}
              </div>

              <div
                style={{
                  opacity: 0.85,
                }}
              >
                {g.type
                  ? g.type.toUpperCase()
                  : "GAME"}{" "}
                {g.home_away
                  ? `• ${g.home_away}`
                  : ""}{" "}
                {g.location
                  ? `• ${g.location}`
                  : ""}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  uploadMatch(g.id)
                }
                style={primaryBtn}
              >
                Upload Match
              </button>

              <button
                type="button"
                onClick={() =>
                  deleteGame(g.id)
                }
                style={dangerBtn}
              >
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
          justifyContent:
            "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 30,
              fontWeight: 950,
              margin: 0,
            }}
          >
            Schedule
          </h1>

          <div
            style={{
              opacity: 0.85,
              marginTop: 6,
            }}
          >
            Add upcoming games here. After the
            match is played, upload the recording
            and final result from the same fixture.
          </div>
        </div>

        <button
          type="button"
          onClick={loadScheduledGames}
          style={secondaryBtn}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div
          style={{
            marginTop: 12,
            color: "#ff6666",
            fontWeight: 950,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          marginTop: 16,
          border:
            "1px solid rgba(255,255,255,0.15)",
          borderRadius: 14,
          padding: 16,
        }}
      >
        <div
          style={{
            fontWeight: 950,
            marginBottom: 10,
          }}
        >
          Create Game
        </div>

        <form
          onSubmit={createGame}
          style={{
            display: "grid",
            gap: 10,
          }}
        >
          <div
            style={{
              display: "grid",
              gap: 10,
              gridTemplateColumns:
                "1fr 1fr",
            }}
          >
            <label
              style={{
                display: "grid",
                gap: 6,
              }}
            >
              <span style={labelStyle}>
                Date
              </span>

              <input
                type="date"
                value={date}
                disabled={saving}
                onChange={(e) =>
                  setDate(e.target.value)
                }
                style={inputStyle}
              />
            </label>

            <label
              style={{
                display: "grid",
                gap: 6,
              }}
            >
              <span style={labelStyle}>
                Time
              </span>

              <input
                type="time"
                value={time}
                disabled={saving}
                onChange={(e) =>
                  setTime(e.target.value)
                }
                style={inputStyle}
              />
            </label>
          </div>

          <div
            style={{
              display: "grid",
              gap: 10,
              gridTemplateColumns:
                "1fr 1fr",
            }}
          >
            <label
              style={{
                display: "grid",
                gap: 6,
              }}
            >
              <span style={labelStyle}>
                Type
              </span>

              <select
                value={type}
                disabled={saving}
                onChange={(e) =>
                  setType(
                    e.target
                      .value as (typeof GAME_TYPES)[number]
                  )
                }
                style={inputStyle}
              >
                {GAME_TYPES.map((t) => (
                  <option
                    key={t}
                    value={t}
                  >
                    {t.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>

            <label
              style={{
                display: "grid",
                gap: 6,
              }}
            >
              <span style={labelStyle}>
                Home/Away
              </span>

              <select
                value={homeAway}
                disabled={saving}
                onChange={(e) =>
                  setHomeAway(
                    e.target
                      .value as (typeof HOME_AWAY)[number]
                  )
                }
                style={inputStyle}
              >
                {HOME_AWAY.map(
                  (ha) => (
                    <option
                      key={ha}
                      value={ha}
                    >
                      {ha.toUpperCase()}
                    </option>
                  )
                )}
              </select>
            </label>
          </div>

          <label
            style={{
              display: "grid",
              gap: 6,
            }}
          >
            <span style={labelStyle}>
              Opponent
            </span>

            <input
              value={opponent}
              disabled={saving}
              onChange={(e) =>
                setOpponent(
                  e.target.value
                )
              }
              placeholder="N. Oakland 16 Black"
              style={inputStyle}
            />
          </label>

          <label
            style={{
              display: "grid",
              gap: 6,
            }}
          >
            <span style={labelStyle}>
              Location (optional)
            </span>

            <input
              value={location}
              disabled={saving}
              onChange={(e) =>
                setLocation(
                  e.target.value
                )
              }
              placeholder="Premier / Indy / Total / etc."
              style={inputStyle}
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            style={{
              ...primaryBtn,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving
              ? "Creating..."
              : "Create Game"}
          </button>
        </form>
      </div>

      <div style={{ marginTop: 16 }}>
        <div
          style={{
            fontWeight: 950,
            marginBottom: 10,
          }}
        >
          Scheduled Games
        </div>

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
  border:
    "1px solid rgba(255,255,255,0.18)",
  background: "transparent",
  color: "inherit",
};

const primaryBtn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  fontWeight: 950,
  cursor: "pointer",
  border:
    "1px solid rgba(255,255,255,0.2)",
  background:
    "rgba(255,255,255,0.06)",
  color: "inherit",
};

const secondaryBtn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  fontWeight: 900,
  cursor: "pointer",
  border:
    "1px solid rgba(255,255,255,0.2)",
  background: "transparent",
  color: "inherit",
};

const dangerBtn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  fontWeight: 950,
  cursor: "pointer",
  border:
    "1px solid rgba(255,255,255,0.2)",
  background: "transparent",
  color: "inherit",
};
