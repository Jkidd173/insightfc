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

  chances: number;

  possessions: number;
  attackingThirdPossessions: number;
};

/**
 * TEAM SIDE
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
 */
export function isShot(event: InsightFCEvent) {
  return event.action === "Shot";
}

/**
 * GOALS
 *
 * Goal is stored as a Shot outcome.
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
 * A Goal also counts as a Shot On Target.
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
 * POSSESSION
 *
 * A possession is counted every time a player receives
 * or gains controlled possession of the ball.
 *
 * The tagging workflow stores this as:
 *
 * possession_start = true
 *
 * Examples:
 *
 * Abby wins the ball                 = Abby 1 possession
 * Abby passes to Hannah              = Hannah 1 possession
 * Abby wins it and shoots herself    = Abby 1 possession
 *
 * Incidental contact does not count.
 *
 * Defensive actions such as Pressure, Tackle and
 * Blocked Shot do not count unless the player actually
 * gains control, which is tagged separately as
 * Possession Won.
 */
export function isPossession(event: InsightFCEvent) {
  return (
    Boolean(event.player_id) &&
    event.possession_start === true
  );
}

/**
 * ATTACKING THIRD POSSESSION
 *
 * A possession counts as an Attacking Third Possession
 * when the possession-starting event is located in any
 * of the three attacking field zones.
 */
export function isAttackingThirdPossession(
  event: InsightFCEvent
) {
  if (!isPossession(event)) return false;

  return (
    event.field_zone === "attacking_left" ||
    event.field_zone === "attacking_center" ||
    event.field_zone === "attacking_right"
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
 * It is not the defensive Blocked Shot action.
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
 * TEAM CHANCES
 *
 * Multiple events belonging to the same attacking
 * opportunity share one chance_id.
 *
 * Therefore we count unique chance_id values rather
 * than counting individual events.
 */
export function calculateChances(
  events: InsightFCEvent[]
) {
  const chanceIds = new Set<string>();

  for (const event of events) {
    if (!isOurTeamEvent(event)) continue;
    if (!event.chance_id) continue;

    chanceIds.add(event.chance_id);
  }

  return chanceIds.size;
}

/**
 * PLAYER CHANCES CREATED
 *
 * Credit goes to the player whose successful Pass or
 * Cross into the box started the chance.
 *
 * A standalone Shot creates a TEAM Chance but does not
 * give the shooter a Chance Created.
 */
export function calculatePlayerChancesCreated(
  events: InsightFCEvent[],
  playerId: string
) {
  const createdChanceIds = new Set<string>();

  for (const event of events) {
    if (!isOurTeamEvent(event)) continue;
    if (event.player_id !== playerId) continue;
    if (!event.chance_id) continue;

    const createdByBoxEntry =
      (event.action === "Pass" ||
        event.action === "Cross") &&
      event.into_box === true &&
      event.outcome === "successful";

    if (createdByBoxEntry) {
      createdChanceIds.add(event.chance_id);
    }
  }

  return createdChanceIds.size;
}

/**
 * TEAM POSSESSIONS
 *
 * Team Possessions are the sum of all player possessions.
 */
export function calculatePossessions(
  events: InsightFCEvent[]
) {
  return events.filter(
    (event) =>
      isOurTeamEvent(event) &&
      isPossession(event)
  ).length;
}

/**
 * TEAM POSSESSIONS IN ATTACKING THIRD
 */
export function calculateAttackingThirdPossessions(
  events: InsightFCEvent[]
) {
  return events.filter(
    (event) =>
      isOurTeamEvent(event) &&
      isAttackingThirdPossession(event)
  ).length;
}

/**
 * PLAYER POSSESSIONS
 */
export function calculatePlayerPossessions(
  events: InsightFCEvent[],
  playerId: string
) {
  return events.filter(
    (event) =>
      isOurTeamEvent(event) &&
      event.player_id === playerId &&
      isPossession(event)
  ).length;
}

/**
 * PLAYER POSSESSIONS IN ATTACKING THIRD
 */
export function calculatePlayerAttackingThirdPossessions(
  events: InsightFCEvent[],
  playerId: string
) {
  return events.filter(
    (event) =>
      isOurTeamEvent(event) &&
      event.player_id === playerId &&
      isAttackingThirdPossession(event)
  ).length;
}

/**
 * POSSESSION %
 *
 * InsightFC defines possession percentage using controlled
 * player possessions rather than clock time.
 *
 * Our Possessions
 * ------------------------------ x 100
 * Our Possessions + Opponent Possessions
 *
 * This is ready for opponent AI events once they are added.
 */
export function calculatePossessionPercentage(
  events: InsightFCEvent[]
) {
  const ourPossessions = events.filter(
    (event) =>
      isOurTeamEvent(event) &&
      isPossession(event)
  ).length;

  const opponentPossessions = events.filter(
    (event) =>
      event.team_side === "opponent" &&
      isPossession(event)
  ).length;

  const total =
    ourPossessions + opponentPossessions;

  if (total === 0) return 0;

  return (ourPossessions / total) * 100;
}

/**
 * MASTER TEAM STATS CALCULATOR
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

    chances: calculateChances(events),

    possessions: calculatePossessions(events),
    attackingThirdPossessions:
      calculateAttackingThirdPossessions(events),
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
