"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Team = {
  id: string;
  name: string;
  season: string | null;
  created_at: string;
  updated_at: string;
};

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [season, setSeason] = useState("");

  async function loadTeams() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/teams", { cache: "no-store" });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json?.error || "Failed to load teams");
      }

      setTeams(json.data || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load teams");
    } finally {
      setLoading(false);
    }
  }

  async function createTeam(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedSeason = season.trim();

    if (!trimmedName) {
      setError("Team name is required");
      return;
    }

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          season: trimmedSeason ? trimmedSeason : null,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json?.error || "Failed to create team");
      }

      // Put new team at the top
      setTeams((prev) => [json.data, ...prev]);
      setName("");
      setSeason("");
    } catch (e: any) {
      setError(e?.message || "Failed to create team");
    }
  }

  useEffect(() => {
    loadTeams();
  }, []);

  return (
    <main style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Teams</h1>

        <button
          onClick={loadTeams}
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

      <section
        style={{
          marginTop: 16,
          padding: 16,
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Create team</h2>

        <form onSubmit={createTeam} style={{ display: "grid", gap: 10, maxWidth: 420 }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Team name (required)"
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "transparent",
            }}
          />
          <input
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            placeholder="Season (optional) — e.g. Spring 2026"
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "transparent",
            }}
          />

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

          {error ? (
            <div style={{ color: "#ff6b6b", fontSize: 14 }}>{error}</div>
          ) : null}
        </form>
      </section>

      <section style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Your teams</h2>

        {loading ? (
          <div>Loading…</div>
        ) : teams.length === 0 ? (
          <div>No teams yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {teams.map((t) => (
              <Link
                key={t.id}
                href={`/teams/${t.id}`}
                style={{
                  display: "block",
                  padding: 14,
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.15)",
                  textDecoration: "none",
                }}
              >
                <div style={{ fontWeight: 800 }}>{t.name}</div>
                <div style={{ opacity: 0.8, fontSize: 14 }}>{t.season || "—"}</div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}