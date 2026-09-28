// lib/stats.ts
//
// InsightFC's central stats calculation layer.
// Stats are derived from clip_events so coaches never need
// to enter the same information twice.

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
};

function isOurTeamEvent(event: InsightFCEvent) {
  return !event.team_side || event.team_side === "our_team";
}

/**
 * TURNOVER
 *
 * A turnover is derived automatically from the underlying action.
 *
 * Current InsightFC rules:
 *
 * Failed Pass       = 1 turnover
 * Failed Cross      = 1 turnover
 * Failed Take-on    = 1 turnover
 * Off-target Shot   = 1 turnover
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
 * Returns the number of turnovers in an event collection.
 *
 * By default this calculates our team's turnovers.
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
 * Calculates the stats currently supported by InsightFC.
 *
 * We will expand this function as each stat definition
 * is finalized.
 */
export function calculateStats(
  events: InsightFCEvent[]
): InsightFCStats {
  return {
    turnovers: calculateTurnovers(events),
  };
}

/**
 * Calculates turnovers for one player.
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
