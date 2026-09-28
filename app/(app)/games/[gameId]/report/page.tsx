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
          "linear-gradient(180deg, #090a08 0%, #10110d 100%)",
        color: "#f7f7f2",
        padding: "34px 22px 70px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1040,
          margin: "0 auto",
        }}
      >
        {/* PAGE HEADER */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 20,
            flexWrap: "wrap",
            marginBottom: 28,
          }}
        >
          <div>
            <div
              style={{
                color: "#d8bd58",
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: 1.4,
                textTransform: "uppercase",
                marginBottom: 9,
              }}
            >
              InsightFC
            </div>

            <h1
              style={{
                margin: 0,
                fontSize:
                  "clamp(32px, 5vw, 52px)",
                lineHeight: 1,
                fontWeight: 950,
                letterSpacing: -1.5,
              }}
            >
              MATCH REPORT
            </h1>

            <div
              style={{
                color: "#a8a89f",
                marginTop: 12,
                fontSize: 15,
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
              color: "#f7f7f2",
              textDecoration: "none",
              border: "1px solid #3b3d35",
              background: "#171914",
              padding: "11px 17px",
              borderRadius: 11,
              fontWeight: 800,
            }}
          >
            ← Back to Team
          </Link>
        </div>

        {/* REPORT CARD */}

        <section
          style={{
            background:
              "linear-gradient(135deg, #e7d27a 0%, #dcc56c 48%, #e6d17b 100%)",
            border:
              "1px solid rgba(235, 211, 105, 0.8)",
            borderRadius: 22,
            overflow: "hidden",
            boxShadow:
              "0 28px 80px rgba(0,0,0,0.38)",
          }}
        >
          {/* MATCHUP */}

          <div
            style={{
              color: "#11120e",
              padding: "36px 28px 30px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(0,1fr) 72px minmax(0,1fr)",
                alignItems: "center",
                textAlign: "center",
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: 1.1,
                    textTransform: "uppercase",
                    marginBottom: 9,
                    opacity: 0.72,
                  }}
                >
                  InsightFC Team
                </div>

                <div
                  style={{
                    fontSize:
                      "clamp(20px, 4vw, 32px)",
                    lineHeight: 1.12,
                    fontWeight: 950,
                  }}
                >
                  {teamName}
                </div>
              </div>

              <div
                style={{
                  fontWeight: 950,
                  fontSize: 20,
                  opacity: 0.7,
                }}
              >
                VS
              </div>

              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: 1.1,
                    textTransform: "uppercase",
                    marginBottom: 9,
                    opacity: 0.72,
                  }}
                >
                  Opponent
                </div>

                <div
                  style={{
                    fontSize:
                      "clamp(20px, 4vw, 32px)",
                    lineHeight: 1.12,
                    fontWeight: 950,
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
                      "1fr 72px 1fr",
                    alignItems: "center",
                    textAlign: "center",
                    marginTop: 28,
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "clamp(48px, 8vw, 72px)",
                      lineHeight: 1,
                      fontWeight: 950,
                    }}
                  >
                    {game.team_score}
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 950,
                      opacity: 0.65,
                    }}
                  >
                    FINAL
                  </div>

                  <div
                    style={{
                      fontSize:
                        "clamp(48px, 8vw, 72px)",
                      lineHeight: 1,
                      fontWeight: 950,
                    }}
                  >
                    {game.opponent_score}
                  </div>
                </div>
              )}
          </div>

          {/* TEAM COLUMN LABELS */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(80px,1fr) minmax(150px,1.25fr) minmax(80px,1fr)",
              alignItems: "center",
              color: "#11120e",
              background:
                "rgba(255,255,255,0.16)",
              borderTop:
                "1px solid rgba(17,18,14,0.12)",
              borderBottom:
                "1px solid rgba(17,18,14,0.16)",
              minHeight: 50,
            }}
          >
            <div
              style={{
                textAlign: "center",
                padding: "10px 8px",
                fontSize: 13,
                fontWeight: 900,
              }}
            >
              {teamName}
            </div>

            <div />

            <div
              style={{
                textAlign: "center",
                padding: "10px 8px",
                fontSize: 13,
                fontWeight: 900,
              }}
            >
              {opponentName}
            </div>
          </div>

          {/* STAT TABLE */}

          <div
            style={{
              margin: 0,
              background: "#11120f",
              color: "#f7f7f2",
            }}
          >
            {metrics.map(
              (metric, index) => (
                <div
                  key={metric.label}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(80px,1fr) minmax(150px,1.25fr) minmax(80px,1fr)",
                    alignItems: "center",
                    minHeight: 61,
                    borderBottom:
                      index ===
                      metrics.length - 1
                        ? "none"
                        : "1px solid rgba(220,197,108,0.26)",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        "center",
                      textAlign: "center",
                      fontSize: 20,
                      fontWeight: 950,
                      padding: "12px 8px",
                    }}
                  >
                    {metric.ours}
                  </div>

                  <div
                    style={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        "center",
                      textAlign: "center",
                      color: "#e5dfc8",
                      fontSize: 14,
                      fontWeight: 750,
                      padding: "12px 10px",
                      borderLeft:
                        "1px solid rgba(220,197,108,0.20)",
                      borderRight:
                        "1px solid rgba(220,197,108,0.20)",
                    }}
                  >
                    {metric.label}
                  </div>

                  <div
                    style={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        "center",
                      textAlign: "center",
                      fontSize: 20,
                      fontWeight: 950,
                      color:
                        hasOpponentData
                          ? "#f7f7f2"
                          : "#77796e",
                      padding: "12px 8px",
                    }}
                  >
                    {metric.opponent}
                  </div>
                </div>
              )
            )}
          </div>

          {/* OPPONENT NOTICE */}

          {!hasOpponentData && (
            <div
              style={{
                padding: "28px",
                color: "#11120e",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 13,
                  background:
                    "rgba(255,255,255,0.18)",
                  border:
                    "1px solid rgba(17,18,14,0.10)",
                  padding: "15px 17px",
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                <div
                  style={{
                    width: 25,
                    height: 25,
                    minWidth: 25,
                    borderRadius: "50%",
                    border:
                      "2px solid #11120e",
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      "center",
                    fontWeight: 950,
                    fontSize: 14,
                  }}
                >
                  i
                </div>

                <div>
                  Opponent analytics will
                  appear when opponent event
                  data is available.
                </div>
              </div>
            </div>
          )}
        </section>

        <div
          style={{
            marginTop: 18,
            textAlign: "center",
            color: "#77796e",
            fontSize: 12,
          }}
        >
          Statistics calculated from tagged
          match events.
        </div>
      </div>
    </main>
  );
}
