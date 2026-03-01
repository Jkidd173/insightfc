"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

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

export default function InProgressPage() {
  const params = useParams();
  const teamId = params?.teamId as string;

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const inProgressGames = useMemo(
    () => games.filter((g) => g.status === "in_progress"),
    [games]
  );

  async function loadGames() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/teams/${teamId}/games`, { cache: "no-store" });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json?.error || "Failed to load games");
      }

      setGames(json.data || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load games");
    } finally {
      setLoading(false);
    }
  }

  async function markCompleted(gameId: string) {
    setError(null);

    try {
      const res = await fetch(`/api/games/${gameId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json?.error || "Failed to mark completed");
      }

      // Update local list
      setGames((prev) => prev.map((g) => (g.id === gameId ? json.data : g)));
    } catch (e: any) {
      setError(e?.message || "Failed to mark completed");
    }
  }

  useEffect(() => {
    if (teamId) loadGames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  return (
    <main style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>In Progress</h1>

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

      <section style={{ marginTop: 16 }}>
        {loading ? (
          <div>Loading…</div>
        ) : inProgressGames.length === 0 ? (
          <div>No in-progress games.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {inProgressGames.map((g) => (
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
                    Resume Tagging
                  </Link>

                  <button
                    onClick={() => markCompleted(g.id)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "rgba(255,255,255,0.06)",
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    Mark Completed
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}