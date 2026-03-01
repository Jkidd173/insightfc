// app/teams/[teamId]/completed/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, type Game } from "@/lib/db";

export default function CompletedPage() {
  const params = useParams<{ teamId: string }>();
  const router = useRouter();
  const teamId = useMemo(
    () => (Array.isArray(params.teamId) ? params.teamId[0] : params.teamId),
    [params]
  );

  const [mounted, setMounted] = useState(false);
  const [games, setGames] = useState<Game[]>([]);

  function refresh() {
    const all = db.getGamesForTeam(teamId);
    const completed = all.filter((g) => g.status === "completed");
    completed.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
    setGames(completed);
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!teamId) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, teamId]);

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Completed</h1>
        <p className="muted">
          Completed games. You can still open tagging from here to review or
          edit.
        </p>
      </div>

      {/* Empty State */}
      {games.length === 0 ? (
        <div className="card">
          <p className="muted">No completed games yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {games.map((g) => (
            <div
              key={g.id}
              className="card p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div className="min-w-0 space-y-1">
                <div className="font-semibold truncate">
                  {g.date ?? "No date"} {g.time ? `• ${g.time}` : ""} — vs{" "}
                  {g.opponent ?? "(Opponent?)"}
                </div>
                <div className="text-sm text-zinc-400">
                  {g.type}
                  {g.location ? ` • ${g.location}` : ""}
                </div>
                <div className="text-xs text-zinc-600">id: {g.id}</div>
              </div>

              <div className="flex flex-wrap gap-3 shrink-0">
                <button
                  className="btn-yellow btn-yellow-text text-outline"
                  onClick={() => router.push(`/games/${g.id}/tag`)}
                >
                  Tag
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}