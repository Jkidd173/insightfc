"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";

type Team = {
  id: string;
  name: string;
  season: string | null;
};

type Player = {
  id: string;
  status: string | null;
};

type Game = {
  id: string;
  team_id: string;
  opponent: string | null;
  date: string | null;
  time: string | null;
  status: string | null;
  type: string | null;
  location: string | null;
  home_away: string | null;
  team_score: number | null;
  opponent_score: number | null;
};

export default function TeamHomePage() {
  const { teamId } = useParams() as { teamId: string };

  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOverview() {
      try {
        setLoading(true);
        setError(null);

        const teamsResponse = await fetch("/api/teams", {
          cache: "no-store",
        });

        const teamsResult = await teamsResponse.json();

        if (!teamsResponse.ok || !teamsResult.ok) {
          throw new Error(
            teamsResult.error || "Unable to load teams."
          );
        }

        const matchingTeam = (teamsResult.data ?? []).find(
          (item: Team) => item.id === teamId
        );

        if (!matchingTeam) {
          throw new Error("Team not found.");
        }

        setTeam(matchingTeam);

        try {
          const playersResponse = await fetch(
            `/api/players?teamId=${encodeURIComponent(teamId)}`,
            {
              cache: "no-store",
            }
          );

          const playersResult = await playersResponse.json();

          if (playersResponse.ok && playersResult.ok) {
            setPlayers(playersResult.data ?? []);
          } else {
            setPlayers([]);
          }
        } catch {
          setPlayers([]);
        }

        try {
          const supabase = supabaseBrowser();

          const { data: gamesData, error: gamesError } =
            await supabase
              .from("games")
              .select(
                "id,team_id,opponent,date,time,status,type,location,home_away,team_score,opponent_score"
              )
              .eq("team_id", teamId)
              .order("date", { ascending: false });

          if (gamesError) {
            console.error("Unable to load games:", gamesError);
            setGames([]);
          } else {
            setGames((gamesData ?? []) as Game[]);
          }
        } catch (gamesError) {
          console.error("Unable to load games:", gamesError);
          setGames([]);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load team overview."
        );
      } finally {
        setLoading(false);
      }
    }

    if (teamId) {
      loadOverview();
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
      <div className="card border-red-500/20">
        <p className="font-bold text-red-300">
          Team overview could not load
        </p>
        <p className="mt-2 text-sm text-red-200">
          {error || "Team not found."}
        </p>
      </div>
    );
  }

  const activePlayers = players.filter(
    (player) => player.status === "active"
  ).length;

  const guestPlayers = players.filter(
    (player) => player.status === "guest"
  ).length;

  /*
   * A game counts toward the season record as soon as both
   * scores have been entered. Video analysis does not need
   * to be complete.
   */
  const gamesWithResults = games.filter(
    (game) =>
      game.team_score !== null &&
      game.opponent_score !== null
  );

  const wins = gamesWithResults.filter(
    (game) =>
      Number(game.team_score) > Number(game.opponent_score)
  ).length;

  const losses = gamesWithResults.filter(
    (game) =>
      Number(game.team_score) < Number(game.opponent_score)
  ).length;

  const draws = gamesWithResults.filter(
    (game) =>
      Number(game.team_score) === Number(game.opponent_score)
  ).length;

  const goalsFor = gamesWithResults.reduce(
    (total, game) => total + Number(game.team_score ?? 0),
    0
  );

  const goalsAgainst = gamesWithResults.reduce(
    (total, game) =>
      total + Number(game.opponent_score ?? 0),
    0
  );

  const upcomingGames = games
    .filter(
      (game) =>
        game.team_score === null ||
        game.opponent_score === null
    )
    .sort((a, b) =>
      String(a.date ?? "").localeCompare(String(b.date ?? ""))
    )
    .slice(0, 3);

  const recentResults = [...gamesWithResults]
    .sort((a, b) =>
      String(b.date ?? "").localeCompare(String(a.date ?? ""))
    )
    .slice(0, 5);

  const stats = [
    {
      label: "Season Record",
      value: `${wins}-${losses}-${draws}`,
      detail: "W - L - D",
    },
    {
      label: "Goals For",
      value: String(goalsFor),
      detail: "This season",
    },
    {
      label: "Goals Against",
      value: String(goalsAgainst),
      detail: "This season",
    },
    {
      label: "Shots",
      value: "0",
      detail: "Awaiting analysis",
    },
    {
      label: "Possession",
      value: "0%",
      detail: "Awaiting analysis",
    },
    {
      label: "Passes Completed",
      value: "0",
      detail: "Awaiting analysis",
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

  function formatDate(date: string | null) {
    if (!date) {
      return "Date TBD";
    }

    const parsed = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
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

          {upcomingGames.length > 0 ? (
            <div className="mt-6 space-y-3">
              {upcomingGames.map((game) => (
                <div
                  key={game.id}
                  className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-bold text-white">
                      {game.home_away === "away"
                        ? `${game.opponent || "Opponent"} vs ${team.name}`
                        : `${team.name} vs ${game.opponent || "Opponent"}`}
                    </p>

                    <p className="mt-1 text-sm text-zinc-500">
                      {formatDate(game.date)}
                      {game.time ? ` · ${game.time}` : ""}
                    </p>
                  </div>

                  <div className="text-sm text-zinc-400">
                    {game.type || "Match"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-yellow-400/20 bg-yellow-400/10 text-xl font-black text-yellow-300">
                +
              </div>

              <h3 className="mt-4 text-lg font-bold text-white">
                No upcoming matches yet
              </h3>

              <p className="muted mx-auto mt-2 max-w-md text-sm">
                Add your next fixture so your upcoming schedule is easy
                to find from the team dashboard.
              </p>

              <Link
                href={`/teams/${teamId}/schedule`}
                className="btn-yellow mt-5"
              >
                + Schedule Match
              </Link>
            </div>
          )}
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

          {recentResults.length > 0 ? (
            <div className="mt-6 space-y-3">
              {recentResults.map((game) => {
                const teamScore = Number(game.team_score ?? 0);
                const opponentScore = Number(
                  game.opponent_score ?? 0
                );

                const result =
                  teamScore > opponentScore
                    ? "W"
                    : teamScore < opponentScore
                    ? "L"
                    : "D";

                return (
                  <div
                    key={game.id}
                    className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm font-black text-white">
                          {result}
                        </span>

                        <div>
                          <p className="font-bold text-white">
                            {game.opponent || "Opponent"}
                          </p>

                          <p className="mt-1 text-xs text-zinc-500">
                            {formatDate(game.date)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-xl font-black text-white">
                        {teamScore} - {opponentScore}
                      </div>

                      <div className="mt-1 text-xs text-zinc-500">
                        Result submitted
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-white/10 px-5 py-9 text-center">
              <p className="font-semibold text-white">
                No match results yet
              </p>

              <p className="muted mx-auto mt-2 max-w-md text-sm">
                Match results will appear here as soon as a match is
                submitted. Player analysis can continue processing
                separately.
              </p>
            </div>
          )}
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
