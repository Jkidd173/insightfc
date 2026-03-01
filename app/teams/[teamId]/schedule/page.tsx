"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type Game = {
  id: string;
  team_id: string;
  type: "game" | "scrimmage" | "tournament";
  status: "scheduled" | "in_progress" | "completed";
  date: string;
  time: string | null;
  opponent: string | null;
  location: string | null;
  home_away: "home" | "away" | null;
};

export default function SchedulePage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params?.teamId as string;

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [opponent, setOpponent] = useState("");
  const [location, setLocation] = useState("");
  const [homeAway, setHomeAway] = useState<"home" | "away" | "">("");

  async function loadGames() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/teams/${teamId}/games`, { cache: "no-store" });
      const json = await res.json();

      if (!res.ok || !json.ok) throw new Error(json?.error || "Failed to load games");
      setGames(json.data || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load games");
    } finally {
      setLoading(false);
    }
  }

  async function createGame(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!date) {
      setError("Date is required");
      return;
    }

    try {
      const res = await fetch(`/api/teams/${teamId}/games`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "game",
          status: "scheduled",
          date,
          time: time || null,
          opponent: opponent || null,
          location: location || null,
          home_away: homeAway || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error || "Failed to create game");

      setGames((prev) => [...prev, json.data]);

      setDate("");
      setTime("");
      setOpponent("");
      setLocation("");
      setHomeAway("");
    } catch (e: any) {
      setError(e?.message || "Failed to create game");
    }
  }

  async function startTagging(gameId: string) {
    setError(null);

    try {
      const res = await fetch(`/api/games/${gameId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "in_progress" }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error || "Failed to start tagging");

      // update local list so it disappears from scheduled immediately
      setGames((prev) => prev.map((g) => (g.id === gameId ? json.data : g)));

      // go to tagging screen
      router.push(`/games/${gameId}/tag`);
    } catch (e: any) {
      setError(e?.message || "Failed to start tagging");
    }
  }

  useEffect(() => {
    if (teamId) loadGames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  const scheduledGames = useMemo(
    () => games.filter((g) => g.status === "scheduled"),
    [games]
  );

  return (
    <main style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Schedule</h1>

        <button
          onClick={loadGames}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          Refresh
        </button>
      </div>

      {error ? <div style={{ marginTop: 12, color: "#ff6b6b" }}>{error}</div> : null}

      <section
        style={{
          marginTop: 16,
          padding: 16,
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Create Game</h2>

        <form onSubmit={createGame} style={{ display: "grid", gap: 10, maxWidth: 420 }}>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />

          <input placeholder="Opponent" value={opponent} onChange={(e) => setOpponent(e.target.value)} />
          <input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />

          <select value={homeAway} onChange={(e) => setHomeAway(e.target.value as any)}>
            <option value="">Home / Away</option>
            <option value="home">Home</option>
            <option value="away">Away</option>
          </select>

          <button
            type="submit"
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.06)",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Create
          </button>
        </form>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Scheduled Games</h2>

        {loading ? (
          <div>Loading…</div>
        ) : scheduledGames.length === 0 ? (
          <div>No scheduled games.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {scheduledGames.map((g) => (
              <div
                key={g.id}
                style={{
                  padding: 14,
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.15)",
                  display: "grid",
                  gap: 8,
                }}
              >
                <div style={{ fontWeight: 800 }}>
                  {g.date} {g.time || ""} — vs {g.opponent || "(Opponent?)"}
                </div>

                <div style={{ fontSize: 14, opacity: 0.85 }}>
                  {g.location || ""} {g.home_away ? `• ${g.home_away}` : ""}
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    onClick={() => startTagging(g.id)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "rgba(255,255,255,0.06)",
                      cursor: "pointer",
                      fontWeight: 800,
                    }}
                  >
                    Start Tagging
                  </button>

                  <Link
                    href={`/games/${g.id}/tag`}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.15)",
                      textDecoration: "none",
                      display: "inline-block",
                    }}
                  >
                    Open Tagging
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}