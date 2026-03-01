// app/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Team = {
  id: string;
  name: string;
  season: string;
};

export default function DashboardPage() {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("insightfc-db");
      if (!stored) return;

      const parsed = JSON.parse(stored);
      setTeams(Array.isArray(parsed?.teams) ? parsed.teams : []);
    } catch {
      setTeams([]);
    }
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">InsightFC</h1>
          <p className="muted">Teams, schedules, tagging, and stats — all in one place.</p>
        </div>

        <Link href="/teams/new" className="btn-yellow btn-yellow-text text-outline inline-flex items-center justify-center">
          + Create Team
        </Link>
      </div>

      {/* Teams List */}
      <div className="space-y-4">
        {teams.length === 0 ? (
          <div className="card">
            <div className="space-y-3">
              <p className="text-zinc-200 font-semibold">No teams yet.</p>
              <p className="muted">Create a team to start scheduling games and tagging events.</p>
              <Link
                href="/teams/new"
                className="btn-yellow btn-yellow-text text-outline inline-flex items-center justify-center"
              >
                Create your first team
              </Link>
            </div>
          </div>
        ) : (
          teams.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="card block hover:border-yellow-400 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{team.name}</h2>
                  <p className="muted">{team.season}</p>
                </div>
                <span className="text-zinc-500 text-sm">Open →</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}