// app/teams/[teamId]/players/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Player = {
  id: string;
  name: string;
  number?: string;
};

export default function PlayersPage() {
  const params = useParams();
  const teamId = params.teamId as string;

  const [mounted, setMounted] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");

  const storageKey = `insightfc:team:${teamId}:players`;

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setPlayers(JSON.parse(stored));
      } catch {
        setPlayers([]);
      }
    }
  }, [storageKey]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(storageKey, JSON.stringify(players));
    }
  }, [players, mounted, storageKey]);

  if (!mounted) return null;

  function addPlayer() {
    if (!name.trim()) return;

    const newPlayer: Player = {
      id: Date.now().toString(),
      name: name.trim(),
      number: number.trim() || undefined,
    };

    setPlayers([...players, newPlayer]);
    setName("");
    setNumber("");
  }

  function deletePlayer(id: string) {
    setPlayers(players.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Players</h1>
        <p className="muted">Build your roster for tagging and stats.</p>
      </div>

      {/* Add Player */}
      <div className="card space-y-4">
        <h2 className="text-xl font-semibold">Add player</h2>

        <div className="grid gap-3 md:grid-cols-3">
          <input
            className="input"
            placeholder="Player name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="input"
            placeholder="Number (optional)"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
          />

          <button
            className="btn-yellow btn-yellow-text text-outline"
            onClick={addPlayer}
          >
            Add
          </button>
        </div>

        <div className="text-xs text-zinc-500">Saved locally for this team.</div>
      </div>

      {/* Roster */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Roster ({players.length})</h2>

        {players.length === 0 ? (
          <div className="card">
            <p className="muted">No players yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {players.map((p) => (
              <div
                key={p.id}
                className="card p-5 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="font-semibold truncate">
                    {p.number ? `#${p.number} ` : ""}
                    {p.name}
                  </div>
                </div>

                <button className="btn-danger" onClick={() => deletePlayer(p.id)}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}