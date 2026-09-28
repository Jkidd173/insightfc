// lib/stats.ts
//
// InsightFC central stats calculation layer.
// All stats are derived from clip_events so coaches never
// need to enter the same information twice.

export type InsightFCEvent = {
  id?: string;
  clip_id?: string;
  game_id?: string;

  player_id: string | null;

  action: string;

  outcome?: string | null;
  shot_outcome?: string | null;

  into_box?: boolean | null;
  possession_start?: boolean | null;

  team_side?: "our_team" | "opponent" | string | null;

  chance_id?: string | null;

  field_zone?: string | null;

  event_seconds?: number | string | null;
};

export type InsightFCStats = {
  turnovers: number;

  shots: number;
  goals: number;

  shotsOnTarget: number;
  shotsOffTarget: number;
  shotsBlocked: number;
};

/**
 * Returns true when the event belongs to our team.
 *
 * Older events may not have team_side populated, so those
 * are treated as our_team for backwards compatibility.
 */
function isOurTeamEvent(event: InsightFCEvent) {
  return !event.team_side || event.team_side === "our_team";
}

/**
 * TURNOVERS
 *
 * InsightFC rules:
 *
 * Failed Pass      = 1 turnover
 * Failed Cross     = 1 turnover
 * Failed Take-on   = 1 turnover
 * Off-target Shot  = 1 turnover
 *
 * Carries do NOT directly create turnovers.
 */
export function isTurnover(event: InsightFCEvent) {
  const failedBallAction =
    (event.action === "Pass" ||
      event.action === "Cross" ||
      event.action === "Take-on") &&
    event.outcome === "unsuccessful";

  const offTargetShot =
    event.action === "Shot" &&
    event.shot_outcome === "off_target";

  return failedBallAction || offTargetShot;
}

/**
 * SHOTS
 *
 * Every event tagged as Shot counts as one shot.
 *
 * The defensive action "Blocked Shot" is intentionally
 * separate and does NOT count as our attacking shot.
 */
export function isShot(event: InsightFCEvent) {
  return event.action === "Shot";
}

/**
 * GOALS
 *
 * Goal is stored as a Shot outcome rather than a separate
 * manual action.
 */
export function isGoal(event: InsightFCEvent) {
  return (
    event.action === "Shot" &&
    event.shot_outcome === "goal"
  );
}

/**
 * SHOTS ON TARGET
 *
 * Goals are also shots on target.
 */
export function isShotOnTarget(event: InsightFCEvent) {
  return (
    event.action === "Shot" &&
    (event.shot_outcome === "goal" ||
      event.shot_outcome === "on_target")
  );
}

export function isShotOffTarget(event: InsightFCEvent) {
  return (
    event.action === "Shot" &&
    event.shot_outcome === "off_target"
  );
}

export function isShotBlocked(event: InsightFCEvent) {
  return (
    event.action === "Shot" &&
    event.shot_outcome === "blocked"
  );
}

/**
 * TEAM TURNOVERS
 */
export function calculateTurnovers(
  events: InsightFCEvent[]
) {
  return events.filter(
    (event) =>
      isOurTeamEvent(event) &&
      isTurnover(event)
  ).length;
}

/**
 * TEAM SHOTS
 */
export function calculateShots(
  events: InsightFCEvent[]
) {
  return events.filter(
    (event) =>
      isOurTeamEvent(event) &&
      isShot(event)
  ).length;
}

/**
 * TEAM GOALS
 */
export function calculateGoals(
  events: InsightFCEvent[]
) {
  return events.filter(
    (event) =>
      isOurTeamEvent(event) &&
      isGoal(event)
  ).length;
}

/**
 * TEAM SHOTS ON TARGET
 */
export function calculateShotsOnTarget(
  events: InsightFCEvent[]
) {
  return events.filter(
    (event) =>
      isOurTeamEvent(event) &&
      isShotOnTarget(event)
  ).length;
}

/**
 * TEAM SHOTS OFF TARGET
 */
export function calculateShotsOffTarget(
  events: InsightFCEvent[]
) {
  return events.filter(
    (event) =>
      isOurTeamEvent(event) &&
      isShotOffTarget(event)
  ).length;
}

/**
 * TEAM BLOCKED SHOT ATTEMPTS
 *
 * This is our attacking Shot -> Blocked outcome.
 * It is NOT the defensive "Blocked Shot" action.
 */
export function calculateShotsBlocked(
  events: InsightFCEvent[]
) {
  return events.filter(
    (event) =>
      isOurTeamEvent(event) &&
      isShotBlocked(event)
  ).length;
}

/**
 * MASTER TEAM STATS CALCULATOR
 *
 * Every finalized InsightFC stat will eventually feed
 * through this function.
 */
export function calculateStats(
  events: InsightFCEvent[]
): InsightFCStats {
  return {
    turnovers: calculateTurnovers(events),

    shots: calculateShots(events),
    goals: calculateGoals(events),

    shotsOnTarget: calculateShotsOnTarget(events),
    shotsOffTarget: calculateShotsOffTarget(events),
    shotsBlocked: calculateShotsBlocked(events),
  };
}

/**
 * PLAYER TURNOVERS
 */
export function calculatePlayerTurnovers(
  events: InsightFCEvent[],
  playerId: string
) {
  return events.filter(
    (event) =>
      isOurTeamEvent(event) &&
      event.player_id === playerId &&
      isTurnover(event)
  ).length;
}

/**
 * PLAYER SHOTS
 */
export function calculatePlayerShots(
  events: InsightFCEvent[],
  playerId: string
) {
  return events.filter(
    (event) =>
      isOurTeamEvent(event) &&
      event.player_id === playerId &&
      isShot(event)
  ).length;
}

/**
 * PLAYER GOALS
 */
export function calculatePlayerGoals(
  events: InsightFCEvent[],
  playerId: string
) {
  return events.filter(
    (event) =>
      isOurTeamEvent(event) &&
      event.player_id === playerId &&
      isGoal(event)
  ).length;
}

/**
 * PLAYER SHOTS ON TARGET
 */
export function calculatePlayerShotsOnTarget(
  events: InsightFCEvent[],
  playerId: string
) {
  return events.filter(
    (event) =>
      isOurTeamEvent(event) &&
      event.player_id === playerId &&
      isShotOnTarget(event)
  ).length;
}
