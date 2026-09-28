// app/(app)/games/[gameId]/report/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  calculateStats,
  type InsightFCEvent,
} from "@/lib/stats";

type PageProps = {
  params: Promise<{
    gameId: string;
  }>;
};

function formatDate(value: string | null) {
  if (!value) return "Match";

  const date = new Date(`${value}T12:00:00`);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPercent(value: number | null) {
  if (value === null) return "—";
  return `${Math.round(value)}%`;
}

function displayNumber(
  value: number,
  available = true
) {
  return available ? String(value) : "—";
}

export default async function MatchReportPage({
  params,
}: PageProps) {
  const { gameId } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: game, error: gameError } =
    await supabase
      .from("games")
      .select(
        `
          id,
          team_id,
          opponent,
          date,
          time,
          location,
          home_away,
          team_score,
          opponent_score,
          status
        `
      )
      .eq("id", gameId)
      .single();

  if (gameError || !game) {
    notFound();
  }

  const { data: team } = await supabase
    .from("teams")
    .select("id, name")
    .eq("id", game.team_id)
    .single();

  const { data: rawEvents } = await supabase
    .from("clip_events")
    .select(
      `
        id,
        clip_id,
        game_id,
        player_id,
        action,
        outcome,
        shot_outcome,
        into_box,
        possession_start,
        team_side,
        chance_id,
        field_zone,
        event_seconds,
        created_at
      `
    )
    .eq("game_id", gameId);

  const events =
    (rawEvents ?? []) as InsightFCEvent[];

  const ourStats = calculateStats(
    events,
    "our_team"
  );

  const opponentStats = calculateStats(
    events,
    "opponent"
  );

  const opponentEvents = events.filter(
    (event) =>
      event.team_side === "opponent"
  );

  const hasOpponentData =
    opponentEvents.length > 0;

  const teamName =
    team?.name ?? "Our Team";

  const opponentName =
    game.opponent ?? "Opponent";

  const metrics = [
    {
      label: "Goals",
      ours: String(ourStats.goals),
      opponent: displayNumber(
        opponentStats.goals,
        hasOpponentData
      ),
    },
    {
      label: "Chances",
      ours: String(ourStats.chances),
      opponent: displayNumber(
        opponentStats.chances,
        hasOpponentData
      ),
    },
    {
      label: "Shots",
      ours: String(ourStats.shots),
      opponent: displayNumber(
        opponentStats.shots,
        hasOpponentData
      ),
    },
    {
      label: "Shots on Target",
      ours: String(
        ourStats.shotsOnTarget
      ),
      opponent: displayNumber(
        opponentStats.shotsOnTarget,
        hasOpponentData
      ),
    },
    {
      label: "Turnovers",
      ours: String(ourStats.turnovers),
      opponent: displayNumber(
        opponentStats.turnovers,
        hasOpponentData
      ),
    },
    {
      label: "Possessions",
      ours: String(ourStats.possessions),
      opponent: displayNumber(
        opponentStats.possessions,
        hasOpponentData
      ),
    },
    {
      label: "Possession %",
      ours: formatPercent(
        ourStats.possessionPercentage
      ),
      opponent: hasOpponentData
        ? formatPercent(
            opponentStats.possessionPercentage
          )
        : "—",
    },
    {
      label: "Passes",
      ours: `${ourStats.completedPasses}/${ourStats.passAttempts}`,
      opponent: hasOpponentData
        ? `${opponentStats.completedPasses}/${opponentStats.passAttempts}`
        : "—",
    },
    {
      label: "Passing %",
      ours: formatPercent(
        ourStats.passingPercentage
      ),
      opponent: hasOpponentData
        ? formatPercent(
            opponentStats.passingPercentage
          )
        : "—",
    },
    {
      label: "Take-ons",
      ours: `${ourStats.successfulTakeOns}/${ourStats.takeOnAttempts}`,
      opponent: hasOpponentData
        ? `${opponentStats.successfulTakeOns}/${opponentStats.takeOnAttempts}`
        : "—",
    },
    {
      label: "Carries 10+ yd",
      ours: String(
        ourStats.carries10Plus
      ),
      opponent: displayNumber(
        opponentStats.carries10Plus,
        hasOpponentData
      ),
    },
    {
      label: "Possessions in Attacking 3rd",
      ours: String(
        ourStats.attackingThirdPossessions
      ),
      opponent: displayNumber(
        opponentStats.attackingThirdPossessions,
        hasOpponentData
      ),
    },
    {
      label: "Highest # Consecutive Passes",
      ours: String(
        ourStats.highestConsecutivePasses
      ),
      opponent: displayNumber(
        opponentStats.highestConsecutivePasses,
        hasOpponentData
      ),
    },
    {
      label: "Pass Strings 4+",
      ours: String(
        ourStats.passStrings4Plus
      ),
      opponent: displayNumber(
        opponentStats.passStrings4Plus,
        hasOpponentData
      ),
    },
    {
      label: "Possessions Won",
      ours: String(
        ourStats.possessionsWon
      ),
      opponent: displayNumber(
        opponentStats.possessionsWon,
        hasOpponentData
      ),
    },
    {
      label: "Tackles",
      ours: `${ourStats.tacklesWon}/${ourStats.tackleAttempts}`,
      opponent: hasOpponentData
        ? `${opponentStats.tacklesWon}/${opponentStats.tackleAttempts}`
        : "—",
    },
    {
      label: "Blocked Shots",
      ours: String(
        ourStats.blockedShots
      ),
      opponent: displayNumber(
        opponentStats.blockedShots,
        hasOpponentData
      ),
    },
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #07111f 0%, #0b1727 100%)",
        color: "#f8fafc",
        padding: "32px 20px 64px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1000,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 28,
          }}
        >
          <div>
            <div
              style={{
                color: "#facc15",
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              InsightFC Match Report
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "clamp(28px, 5vw, 44px)",
                lineHeight: 1,
                fontWeight: 900,
              }}
            >
              Game Summary
            </h1>

            <div
              style={{
                color: "#94a3b8",
                marginTop: 10,
                fontSize: 14,
              }}
            >
              {formatDate(game.date)}
              {game.location
                ? ` • ${game.location}`
                : ""}
            </div>
          </div>

          <Link
            href={`/teams/${game.team_id}`}
            style={{
              color: "#e2e8f0",
              textDecoration: "none",
              border: "1px solid #334155",
              background: "#111d2d",
              padding: "10px 16px",
              borderRadius: 10,
              fontWeight: 700,
            }}
          >
            ← Team Overview
          </Link>
        </div>

        <section
          style={{
            background:
              "linear-gradient(180deg, #111d2d 0%, #0d1827 100%)",
            border: "1px solid #26364a",
            borderRadius: 20,
            overflow: "hidden",
            boxShadow:
              "0 24px 70px rgba(0,0,0,0.28)",
          }}
        >
          <div
            style={{
              padding: "30px 24px",
              borderBottom:
                "1px solid #26364a",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(0, 1fr) 70px minmax(0, 1fr)",
                alignItems: "center",
                gap: 12,
                textAlign: "center",
              }}
            >
              <div>
                <div
                  style={{
                    color: "#94a3b8",
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: 1.2,
                    marginBottom: 8,
                  }}
                >
                  InsightFC Team
                </div>

                <div
                  style={{
                    fontSize:
                      "clamp(18px, 4vw, 30px)",
                    fontWeight: 900,
                  }}
                >
                  {teamName}
                </div>
              </div>

              <div
                style={{
                  color: "#64748b",
                  fontWeight: 900,
                  fontSize: 18,
                }}
              >
                VS
              </div>

              <div>
                <div
                  style={{
                    color: "#94a3b8",
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: 1.2,
                    marginBottom: 8,
                  }}
                >
                  Opponent
                </div>

                <div
                  style={{
                    fontSize:
                      "clamp(18px, 4vw, 30px)",
                    fontWeight: 900,
                  }}
                >
                  {opponentName}
                </div>
              </div>
            </div>

            {game.team_score !== null &&
              game.opponent_score !== null && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1fr 70px 1fr",
                    textAlign: "center",
                    alignItems: "center",
                    marginTop: 22,
                  }}
                >
                  <div
                    style={{
                      fontSize: 38,
                      fontWeight: 900,
                      color: "#facc15",
                    }}
                  >
                    {game.team_score}
                  </div>

                  <div
                    style={{
                      color: "#64748b",
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    FINAL
                  </div>

                  <div
                    style={{
                      fontSize: 38,
                      fontWeight: 900,
                    }}
                  >
                    {game.opponent_score}
                  </div>
                </div>
              )}
          </div>

          {!hasOpponentData && (
            <div
              style={{
                padding: "12px 20px",
                background:
                  "rgba(250, 204, 21, 0.07)",
                borderBottom:
                  "1px solid #26364a",
                color: "#cbd5e1",
                fontSize: 13,
                textAlign: "center",
              }}
            >
              Opponent analytics will appear
              when opponent event data is
              available.
            </div>
          )}

          <div>
            {metrics.map((metric) => (
              <div
                key={metric.label}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(70px, 1fr) minmax(130px, 1.4fr) minmax(70px, 1fr)",
                  alignItems: "center",
                  minHeight: 62,
                  borderBottom:
                    "1px solid #223044",
                }}
              >
                <div
                  style={{
                    textAlign: "center",
                    fontSize: 18,
                    fontWeight: 900,
                    color: "#f8fafc",
                    padding: "12px 8px",
                  }}
                >
                  {metric.ours}
                </div>

                <div
                  style={{
                    textAlign: "center",
                    color: "#94a3b8",
                    fontSize: 13,
                    fontWeight: 800,
                    padding: "12px 8px",
                  }}
                >
                  {metric.label}
                </div>

                <div
                  style={{
                    textAlign: "center",
                    fontSize: 18,
                    fontWeight: 900,
                    color: hasOpponentData
                      ? "#f8fafc"
                      : "#475569",
                    padding: "12px 8px",
                  }}
                >
                  {metric.opponent}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div
          style={{
            marginTop: 20,
            color: "#64748b",
            fontSize: 12,
            textAlign: "center",
          }}
        >
          Statistics are calculated from
          tagged match events.
        </div>
      </div>
    </main>
  );
}
