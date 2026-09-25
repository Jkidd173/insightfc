"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Team = {
  id: string;
  name: string;
  season: string | null;
};

type Player = {
  id: string;
  status: string | null;
};

export default function TeamHomePage() {
  const { teamId } = useParams() as { teamId: string };

  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTeamOverview() {
      try {
        setLoading(true);
        setError(null);

        // Load the team
        const { data: teamData, error: teamError } = await supabase
          .from("teams")
          .select("id,name,season")
          .eq("id", teamId)
          .single();

        if (teamError) {
          throw teamError;
        }

        setTeam(teamData as Team);

        // Load players through the authenticated API.
        // If this fails, the overview still loads.
        try {
          const response = await fetch(
            `/api/players?teamId=${encodeURIComponent(teamId)}`,
            {
              cache: "no-store",
            }
          );

          const result = await response.json();

          if (response.ok && result.ok) {
            setPlayers(result.data ?? []);
          } else {
            setPlayers([]);
          }
        } catch {
          setPlayers([]);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load team overview."
        );
      } finally {
        setLoading(false);
      }
    }

    if (teamId) {
      loadTeamOverview();
    }
  }, [teamId]);

  if (loading) {
    return (
      <div className="card text-zinc-400">
        Loading team overview...
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="card border-red-500/20 text-red-300">
        {error || "Team not found."}
      </div>
    );
  }

  const activePlayers = players.filter(
    (player) => player.status === "active"
  ).length;

  const guestPlayers = players.filter(
    (player) => player.status === "guest"
  ).length;

  const stats = [
    {
      label: "Season Record",
      value: "0-0-0",
      detail: "W - L - D",
    },
    {
      label: "Goals",
      value: "0",
      detail: "This season",
    },
    {
      label: "Shots",
      value: "0",
      detail: "This season",
    },
    {
      label: "Possession",
      value: "0%",
      detail: "Average",
    },
    {
      label: "Passes Completed",
      value: "0",
      detail: "This season",
    },
    {
      label: "Active Players",
      value: String(activePlayers),
      detail:
        guestPlayers > 0
          ? `${guestPlayers} guest ${
              guestPlayers === 1 ? "player" : "players"
            }`
          : "Current roster",
    },
  ];

  const leaderboards = [
    "Pass %",
    "Touches",
    "Shots",
    "Crosses",
    "Take-ons",
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="eyebrow">Team overview</div>

          <h1 className="page-title mt-2">{team.name}</h1>

          <p className="muted mt-2">
            {team.season || "Current season"} · Performance dashboard
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/teams/${teamId}/players`}
            className="btn-ghost"
          >
            Manage Players
          </Link>

          <Link
            href={`/teams/${teamId}/schedule`}
            className="btn-ghost"
          >
            + Schedule Match
          </Link>

          <Link href="/upload" className="btn-yellow">
            Upload Match
          </Link>
        </div>
      </header>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <div className="eyebrow">Season snapshot</div>

            <h2 className="mt-2 text-xl font-bold text-white">
              Team Performance
            </h2>
          </div>

          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">
            {team.season || "Current season"}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                {stat.label}
              </p>

              <p className="mt-3 text-3xl font-black text-white">
                {stat.value}
              </p>

              <p className="mt-2 text-xs text-zinc-500">
                {stat.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <section className="card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="eyebrow">Schedule</div>

              <h2 className="mt-2 text-xl font-bold text-white">
                Upcoming Matches
              </h2>
            </div>

            <Link
              href={`/teams/${teamId}/schedule`}
              className="text-sm font-bold text-yellow-400 hover:text-yellow-300"
            >
              View schedule →
            </Link>
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-yellow-400/20 bg-yellow-400/10 text-xl font-black text-yellow-300">
              +
            </div>

            <h3 className="mt-4 text-lg font-bold text-white">
              No upcoming matches yet
            </h3>

            <p className="muted mx-auto mt-2 max-w-md text-sm">
              Add your next fixture so your upcoming schedule is
              easy to find from the team dashboard.
            </p>

            <Link
              href={`/teams/${teamId}/schedule`}
              className="btn-yellow mt-5"
            >
              + Schedule Match
            </Link>
          </div>
        </section>

        <section className="card">
          <div className="eyebrow">Roster</div>

          <div className="mt-2 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                Team Players
              </h2>

              <p className="muted mt-1 text-sm">
                Current active roster
              </p>
            </div>

            <div className="text-right">
              <div className="text-4xl font-black text-white">
                {activePlayers}
              </div>

              <div className="mt-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
                Active
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-2xl font-black text-white">
                {activePlayers}
              </div>

              <div className="mt-1 text-xs text-zinc-500">
                Active players
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-2xl font-black text-white">
                {guestPlayers}
              </div>

              <div className="mt-1 text-xs text-zinc-500">
                Guest players
              </div>
            </div>
          </div>

          <Link
            href={`/teams/${teamId}/players`}
            className="btn-ghost mt-5 w-full justify-between"
          >
            Manage roster <span>→</span>
          </Link>
        </section>
      </div>

      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="eyebrow">Player development</div>

            <h2 className="mt-2 text-xl font-bold text-white">
              Player Leaders
            </h2>

            <p className="muted mt-1 text-sm">
              Top performers across key development metrics.
            </p>
          </div>

          <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-300">
            Unlocks with match analysis
          </span>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-5">
          {leaderboards.map((metric) => (
            <div
              key={metric}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                {metric}
              </p>

              <div className="mt-5 text-2xl font-black text-zinc-600">
                —
              </div>

              <p className="mt-2 text-xs text-zinc-600">
                No match data yet
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-dashed border-white/10 px-5 py-5 text-center">
          <p className="font-semibold text-white">
            Analyze your first match to unlock player leaders
          </p>

          <p className="muted mx-auto mt-1 max-w-xl text-sm">
            InsightFC will surface player performance across passing,
            touches, shooting, crosses, take-ons, and other
            development actions.
          </p>

          <Link href="/upload" className="btn-yellow mt-4">
            Upload First Match
          </Link>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <section className="card">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="eyebrow">Match history</div>

              <h2 className="mt-2 text-xl font-bold text-white">
                Recent Matches
              </h2>
            </div>

            <Link
              href={`/teams/${teamId}/completed`}
              className="text-sm font-bold text-yellow-400 hover:text-yellow-300"
            >
              Match archive →
            </Link>
          </div>

          <div className="mt-6 rounded-xl border border-dashed border-white/10 px-5 py-9 text-center">
            <p className="font-semibold text-white">
              No matches analyzed yet
            </p>

            <p className="muted mx-auto mt-2 max-w-md text-sm">
              Completed matches and team performance trends will
              appear here after your first analysis.
            </p>
          </div>
        </section>

        <aside className="card">
          <div className="eyebrow">Quick actions</div>

          <div className="mt-4 space-y-2">
            <Link
              className="btn-ghost w-full justify-between"
              href={`/teams/${teamId}/players`}
            >
              Manage players <span>→</span>
            </Link>

            <Link
              className="btn-ghost w-full justify-between"
              href={`/teams/${teamId}/schedule`}
            >
              Schedule match <span>→</span>
            </Link>

            <Link
              className="btn-ghost w-full justify-between"
              href="/upload"
            >
              Upload match <span>→</span>
            </Link>

            <Link
              className="btn-ghost w-full justify-between"
              href={`/teams/${teamId}/in-progress`}
            >
              Active analysis <span>→</span>
            </Link>

            <Link
              className="btn-ghost w-full justify-between"
              href={`/teams/${teamId}/completed`}
            >
              Match archive <span>→</span>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
