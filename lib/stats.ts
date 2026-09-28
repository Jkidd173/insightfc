// lib/stats.ts
//
// InsightFC central stats engine.
//
// All statistics are derived from clip_events.
// Coaches tag the underlying soccer action once;
// InsightFC calculates the statistics automatically.

export type TeamSide = "our_team" | "opponent";

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

  team_side?: TeamSide | string | null;

  chance_id?: string | null;

  field_zone?: string | null;

  event_seconds?: number | string | null;
  created_at?: string | null;
};

export type InsightFCStats = {
  // ATTACKING
  goals: number;
  chances: number;

  shots: number;
  shotsOnTarget: number;
  shotsOffTarget: number;
  shotsBlocked: number;

  assists: number;

  // POSSESSION
  possessions: number;
  possessionPercentage: number | null;
  attackingThirdPossessions: number;

  turnovers: number;

  // PASSING
  passAttempts: number;
  completedPasses: number;
  passingPercentage: number | null;

  highestConsecutivePasses: number;
  passStrings4Plus: number;

  // BALL PROGRESSION
  carries10Plus: number;

  takeOnAttempts: number;
  successfulTakeOns: number;
  takeOnPercentage: number | null;

  // DEFENDING
  possessionsWon: number;

  tackleAttempts: number;
  tacklesWon: number;
  tacklePercentage: number | null;

  blockedShots: number;
  pressures: number;
};

export type PlayerStats = {
  playerId: string;

  goals: number;
  chancesCreated: number;

  shots: number;
  shotsOnTarget: number;
  shotsOffTarget: number;
  shotsBlocked: number;

  assists: number;

  possessions: number;
  attackingThirdPossessions: number;

  turnovers: number;

  passAttempts: number;
  completedPasses: number;
  passingPercentage: number | null;

  carries10Plus: number;

  takeOnAttempts: number;
  successfulTakeOns: number;
  takeOnPercentage: number | null;

  possessionsWon: number;

  tackleAttempts: number;
  tacklesWon: number;
  tacklePercentage: number | null;

  blockedShots: number;
  pressures: number;
};

/* =========================================================
   BASIC HELPERS
   ========================================================= */

function sideOf(event: InsightFCEvent): TeamSide {
  // Older InsightFC events were created before team_side
  // existed. Those events belong to our team.
  return event.team_side === "opponent"
    ? "opponent"
    : "our_team";
}

function eventTime(event: InsightFCEvent) {
  const value = Number(event.event_seconds);

  if (Number.isFinite(value)) {
    return value;
  }

  return 0;
}

function chronologicalEvents(events: InsightFCEvent[]) {
  return [...events].sort((a, b) => {
    const timeDifference =
      eventTime(a) - eventTime(b);

    if (timeDifference !== 0) {
      return timeDifference;
    }

    const aCreated = a.created_at
      ? new Date(a.created_at).getTime()
      : 0;

    const bCreated = b.created_at
      ? new Date(b.created_at).getTime()
      : 0;

    return aCreated - bCreated;
  });
}

function eventsForSide(
  events: InsightFCEvent[],
  side: TeamSide
) {
  return events.filter(
    (event) => sideOf(event) === side
  );
}

function playerEvents(
  events: InsightFCEvent[],
  playerId: string
) {
  return events.filter(
    (event) =>
      sideOf(event) === "our_team" &&
      event.player_id === playerId
  );
}

function percentage(
  successful: number,
  attempts: number
): number | null {
  if (attempts === 0) {
    return null;
  }

  return (successful / attempts) * 100;
}

/* =========================================================
   TURNOVERS
   ========================================================= */

/**
 * InsightFC turnover rules:
 *
 * Failed Pass     = turnover
 * Failed Cross    = turnover
 * Failed Take-on  = turnover
 * Off-target Shot = turnover
 *
 * Carry 10+ yd does NOT directly create a turnover.
 */
export function isTurnover(event: InsightFCEvent) {
  const failedDistribution =
    (event.action === "Pass" ||
      event.action === "Cross") &&
    event.outcome === "unsuccessful";

  const failedTakeOn =
    event.action === "Take-on" &&
    event.outcome === "unsuccessful";

  const offTargetShot =
    event.action === "Shot" &&
    event.shot_outcome === "off_target";

  return (
    failedDistribution ||
    failedTakeOn ||
    offTargetShot
  );
}

export function calculateTurnovers(
  events: InsightFCEvent[],
  side: TeamSide = "our_team"
) {
  return eventsForSide(events, side).filter(
    isTurnover
  ).length;
}

/* =========================================================
   SHOTS + GOALS
   ========================================================= */

export function isShot(event: InsightFCEvent) {
  return event.action === "Shot";
}

export function isGoal(event: InsightFCEvent) {
  return (
    event.action === "Shot" &&
    event.shot_outcome === "goal"
  );
}

export function isShotOnTarget(
  event: InsightFCEvent
) {
  return (
    event.action === "Shot" &&
    (event.shot_outcome === "goal" ||
      event.shot_outcome === "on_target")
  );
}

export function isShotOffTarget(
  event: InsightFCEvent
) {
  return (
    event.action === "Shot" &&
    event.shot_outcome === "off_target"
  );
}

export function isAttackingShotBlocked(
  event: InsightFCEvent
) {
  return (
    event.action === "Shot" &&
    event.shot_outcome === "blocked"
  );
}

export function calculateShots(
  events: InsightFCEvent[],
  side: TeamSide = "our_team"
) {
  return eventsForSide(events, side).filter(
    isShot
  ).length;
}

export function calculateGoals(
  events: InsightFCEvent[],
  side: TeamSide = "our_team"
) {
  return eventsForSide(events, side).filter(
    isGoal
  ).length;
}

export function calculateShotsOnTarget(
  events: InsightFCEvent[],
  side: TeamSide = "our_team"
) {
  return eventsForSide(events, side).filter(
    isShotOnTarget
  ).length;
}

export function calculateShotsOffTarget(
  events: InsightFCEvent[],
  side: TeamSide = "our_team"
) {
  return eventsForSide(events, side).filter(
    isShotOffTarget
  ).length;
}

export function calculateShotsBlocked(
  events: InsightFCEvent[],
  side: TeamSide = "our_team"
) {
  return eventsForSide(events, side).filter(
    isAttackingShotBlocked
  ).length;
}

/* =========================================================
   CHANCES
   ========================================================= */

/**
 * Team Chances are UNIQUE chance_id values.
 *
 * Example:
 *
 * Abigail Cross Into Box -> chance_id A
 * Hannah Shot            -> chance_id A
 *
 * Team result = ONE Chance.
 */
export function calculateChances(
  events: InsightFCEvent[],
  side: TeamSide = "our_team"
) {
  const ids = new Set<string>();

  for (const event of eventsForSide(
    events,
    side
  )) {
    if (event.chance_id) {
      ids.add(event.chance_id);
    }
  }

  return ids.size;
}

/**
 * Chance Created:
 *
 * Player gets credit when a successful Pass Into Box
 * or successful Cross Into Box starts the chance.
 *
 * A standalone Shot creates a TEAM Chance but does not
 * give the shooter a Chance Created.
 */
export function calculatePlayerChancesCreated(
  events: InsightFCEvent[],
  playerId: string
) {
  const ids = new Set<string>();

  for (const event of playerEvents(
    events,
    playerId
  )) {
    if (!event.chance_id) continue;

    const createdChance =
      (event.action === "Pass" ||
        event.action === "Cross") &&
      event.into_box === true &&
      event.outcome === "successful";

    if (createdChance) {
      ids.add(event.chance_id);
    }
  }

  return ids.size;
}

/* =========================================================
   POSSESSIONS
   ========================================================= */

/**
 * A player possession is counted whenever the player
 * receives or gains controlled possession.
 *
 * The tagging system records this with:
 *
 * possession_start = true
 */
export function isPossession(
  event: InsightFCEvent
) {
  return (
    Boolean(event.player_id) &&
    event.possession_start === true
  );
}

export function isAttackingThirdPossession(
  event: InsightFCEvent
) {
  if (!isPossession(event)) {
    return false;
  }

  return (
    event.field_zone === "attacking_left" ||
    event.field_zone === "attacking_center" ||
    event.field_zone === "attacking_right"
  );
}

export function calculatePossessions(
  events: InsightFCEvent[],
  side: TeamSide = "our_team"
) {
  return eventsForSide(events, side).filter(
    isPossession
  ).length;
}

export function calculateAttackingThirdPossessions(
  events: InsightFCEvent[],
  side: TeamSide = "our_team"
) {
  return eventsForSide(events, side).filter(
    isAttackingThirdPossession
  ).length;
}

/**
 * Possession % is based on controlled player
 * possessions, not clock time.
 *
 * Our Possessions
 * ------------------------------ x 100
 * Our Possessions + Opponent Possessions
 *
 * Returns null until BOTH sides have possession data.
 * This prevents InsightFC from displaying a fake 100%
 * while only our team has been tagged.
 */
export function calculatePossessionPercentage(
  events: InsightFCEvent[],
  side: TeamSide = "our_team"
): number | null {
  const ours = calculatePossessions(
    events,
    "our_team"
  );

  const opponents = calculatePossessions(
    events,
    "opponent"
  );

  if (ours === 0 || opponents === 0) {
    return null;
  }

  const total = ours + opponents;

  const requested =
    side === "our_team" ? ours : opponents;

  return (requested / total) * 100;
}

/* =========================================================
   PASSING
   ========================================================= */

/**
 * IMPORTANT:
 *
 * Crosses are NOT included in normal Pass Attempts,
 * Completed Passes, or Passing %.
 *
 * Pass Into Box IS still a Pass and therefore DOES
 * count toward normal passing statistics.
 */
export function isPass(event: InsightFCEvent) {
  return event.action === "Pass";
}

export function isCompletedPass(
  event: InsightFCEvent
) {
  return (
    event.action === "Pass" &&
    event.outcome === "successful"
  );
}

export function calculatePassAttempts(
  events: InsightFCEvent[],
  side: TeamSide = "our_team"
) {
  return eventsForSide(events, side).filter(
    isPass
  ).length;
}

export function calculateCompletedPasses(
  events: InsightFCEvent[],
  side: TeamSide = "our_team"
) {
  return eventsForSide(events, side).filter(
    isCompletedPass
  ).length;
}

export function calculatePassingPercentage(
  events: InsightFCEvent[],
  side: TeamSide = "our_team"
) {
  const attempts = calculatePassAttempts(
    events,
    side
  );

  const completed =
    calculateCompletedPasses(events, side);

  return percentage(completed, attempts);
}

/* =========================================================
   PASS STRINGS
   ========================================================= */

/**
 * Crosses are excluded from normal passing statistics,
 * BUT they participate in pass strings.
 *
 * Successful Pass  -> +1 and string continues
 * Successful Cross -> +1 and string continues
 *
 * Failed Pass      -> string ends
 * Failed Cross     -> string ends
 *
 * Failed Take-on and Off-target Shot are turnovers,
 * so they also end the string.
 *
 * Carry and other non-turnover actions do not add a
 * pass to the string and do not break it.
 *
 * Example:
 *
 * Pass ✓
 * Pass ✓
 * Cross ✓
 * Pass ✓
 * Pass ✓
 *
 * = 5 consecutive completed distributions.
 */

function isSuccessfulStringDistribution(
  event: InsightFCEvent
) {
  return (
    (event.action === "Pass" ||
      event.action === "Cross") &&
    event.outcome === "successful"
  );
}

function isFailedStringDistribution(
  event: InsightFCEvent
) {
  return (
    (event.action === "Pass" ||
      event.action === "Cross") &&
    event.outcome === "unsuccessful"
  );
}

export function calculatePassingStrings(
  events: InsightFCEvent[],
  side: TeamSide = "our_team"
) {
  const ordered = chronologicalEvents(events);

  let current = 0;
  let highest = 0;
  let strings4Plus = 0;

  let currentStringReachedFour = false;

  for (const event of ordered) {
    const eventSide = sideOf(event);

    // An opponent event means our team no longer owns
    // this passing sequence.
    if (eventSide !== side) {
      if (current > 0) {
        current = 0;
        currentStringReachedFour = false;
      }

      continue;
    }

    if (isSuccessfulStringDistribution(event)) {
      current += 1;

      if (current > highest) {
        highest = current;
      }

      if (
        current >= 4 &&
        !currentStringReachedFour
      ) {
        strings4Plus += 1;
        currentStringReachedFour = true;
      }

      continue;
    }

    if (
      isFailedStringDistribution(event) ||
      isTurnover(event)
    ) {
      current = 0;
      currentStringReachedFour = false;
    }
  }

  return {
    highestConsecutivePasses: highest,
    passStrings4Plus: strings4Plus,
  };
}

/* =========================================================
   TAKE-ONS
   ========================================================= */

export function calculateTakeOnAttempts(
  events: InsightFCEvent[],
  side: TeamSide = "our_team"
) {
  return eventsForSide(events, side).filter(
    (event) => event.action === "Take-on"
  ).length;
}

export function calculateSuccessfulTakeOns(
  events: InsightFCEvent[],
  side: TeamSide = "our_team"
) {
  return eventsForSide(events, side).filter(
    (event) =>
      event.action === "Take-on" &&
      event.outcome === "successful"
  ).length;
}

export function calculateTakeOnPercentage(
  events: InsightFCEvent[],
  side: TeamSide = "our_team"
) {
  const attempts = calculateTakeOnAttempts(
    events,
    side
  );

  const successful =
    calculateSuccessfulTakeOns(events, side);

  return percentage(successful, attempts);
}

/* =========================================================
   CARRIES
   ========================================================= */

export function calculateCarries10Plus(
  events: InsightFCEvent[],
  side: TeamSide = "our_team"
) {
  return eventsForSide(events, side).filter(
    (event) =>
      event.action === "Carry 10+ yd"
  ).length;
}

/* =========================================================
   ASSISTS
   ========================================================= */

export function calculateAssists(
  events: InsightFCEvent[],
  side: TeamSide = "our_team"
) {
  return eventsForSide(events, side).filter(
    (event) => event.action === "Assist"
  ).length;
}

/* =========================================================
   DEFENDING
   ========================================================= */

/**
 * Possession Won:
 *
 * Player actually gains controlled possession from
 * the opponent.
 *
 * This also creates a player possession because the
 * tagging workflow automatically sets
 * possession_start = true.
 */
export function calculatePossessionsWon(
  events: InsightFCEvent[],
  side: TeamSide = "our_team"
) {
  return eventsForSide(events, side).filter(
    (event) =>
      event.action === "Possession Won"
  ).length;
}

/**
 * Tackles:
 *
 * Tackle = deliberate defensive challenge against an
 * opponent in possession.
 *
 * Successful Tackle does NOT automatically mean the
 * defender gained possession. If possession is actually
 * gained, Possession Won is tagged separately.
 */
export function calculateTackleAttempts(
  events: InsightFCEvent[],
  side: TeamSide = "our_team"
) {
  return eventsForSide(events, side).filter(
    (event) => event.action === "Tackle"
  ).length;
}

export function calculateTacklesWon(
  events: InsightFCEvent[],
  side: TeamSide = "our_team"
) {
  return eventsForSide(events, side).filter(
    (event) =>
      event.action === "Tackle" &&
      event.outcome === "successful"
  ).length;
}

export function calculateTacklePercentage(
  events: InsightFCEvent[],
  side: TeamSide = "our_team"
) {
  const attempts = calculateTackleAttempts(
    events,
    side
  );

  const won = calculateTacklesWon(
    events,
    side
  );

  return percentage(won, attempts);
}

/**
 * Defensive Blocked Shot.
 *
 * This is intentionally different from:
 *
 * action = Shot
 * shot_outcome = blocked
 *
 * The former is a defensive statistic.
 * The latter is an attacking shot attempt.
 */
export function calculateDefensiveBlockedShots(
  events: InsightFCEvent[],
  side: TeamSide = "our_team"
) {
  return eventsForSide(events, side).filter(
    (event) =>
      event.action === "Blocked Shot"
  ).length;
}

export function calculatePressures(
  events: InsightFCEvent[],
  side: TeamSide = "our_team"
) {
  return eventsForSide(events, side).filter(
    (event) => event.action === "Pressure"
  ).length;
}

/* =========================================================
   PLAYER STATS
   ========================================================= */

export function calculatePlayerStats(
  events: InsightFCEvent[],
  playerId: string
): PlayerStats {
  const player = playerEvents(
    events,
    playerId
  );

  const passAttempts =
    player.filter(isPass).length;

  const completedPasses =
    player.filter(isCompletedPass).length;

  const takeOnAttempts =
    player.filter(
      (event) =>
        event.action === "Take-on"
    ).length;

  const successfulTakeOns =
    player.filter(
      (event) =>
        event.action === "Take-on" &&
        event.outcome === "successful"
    ).length;

  const tackleAttempts =
    player.filter(
      (event) =>
        event.action === "Tackle"
    ).length;

  const tacklesWon =
    player.filter(
      (event) =>
        event.action === "Tackle" &&
        event.outcome === "successful"
    ).length;

  return {
    playerId,

    goals: player.filter(isGoal).length,

    chancesCreated:
      calculatePlayerChancesCreated(
        events,
        playerId
      ),

    shots: player.filter(isShot).length,

    shotsOnTarget:
      player.filter(isShotOnTarget).length,

    shotsOffTarget:
      player.filter(isShotOffTarget).length,

    shotsBlocked:
      player.filter(
        isAttackingShotBlocked
      ).length,

    assists: player.filter(
      (event) =>
        event.action === "Assist"
    ).length,

    possessions: player.filter(
      isPossession
    ).length,

    attackingThirdPossessions:
      player.filter(
        isAttackingThirdPossession
      ).length,

    turnovers: player.filter(
      isTurnover
    ).length,

    passAttempts,

    completedPasses,

    passingPercentage: percentage(
      completedPasses,
      passAttempts
    ),

    carries10Plus: player.filter(
      (event) =>
        event.action === "Carry 10+ yd"
    ).length,

    takeOnAttempts,

    successfulTakeOns,

    takeOnPercentage: percentage(
      successfulTakeOns,
      takeOnAttempts
    ),

    possessionsWon: player.filter(
      (event) =>
        event.action === "Possession Won"
    ).length,

    tackleAttempts,

    tacklesWon,

    tacklePercentage: percentage(
      tacklesWon,
      tackleAttempts
    ),

    blockedShots: player.filter(
      (event) =>
        event.action === "Blocked Shot"
    ).length,

    pressures: player.filter(
      (event) =>
        event.action === "Pressure"
    ).length,
  };
}

/* =========================================================
   MASTER TEAM STATS
   ========================================================= */

/**
 * This is the main function the Match Report and Team
 * Stats pages should use.
 *
 * It supports both:
 *
 * calculateStats(events, "our_team")
 *
 * and later:
 *
 * calculateStats(events, "opponent")
 *
 * That means AI-generated opponent events can feed into
 * the exact same statistics engine.
 */
export function calculateStats(
  events: InsightFCEvent[],
  side: TeamSide = "our_team"
): InsightFCStats {
  const passingStrings =
    calculatePassingStrings(events, side);

  const passAttempts =
    calculatePassAttempts(events, side);

  const completedPasses =
    calculateCompletedPasses(events, side);

  const takeOnAttempts =
    calculateTakeOnAttempts(events, side);

  const successfulTakeOns =
    calculateSuccessfulTakeOns(events, side);

  const tackleAttempts =
    calculateTackleAttempts(events, side);

  const tacklesWon =
    calculateTacklesWon(events, side);

  return {
    // ATTACKING
    goals: calculateGoals(events, side),

    chances: calculateChances(
      events,
      side
    ),

    shots: calculateShots(events, side),

    shotsOnTarget:
      calculateShotsOnTarget(events, side),

    shotsOffTarget:
      calculateShotsOffTarget(events, side),

    shotsBlocked:
      calculateShotsBlocked(events, side),

    assists: calculateAssists(
      events,
      side
    ),

    // POSSESSION
    possessions: calculatePossessions(
      events,
      side
    ),

    possessionPercentage:
      calculatePossessionPercentage(
        events,
        side
      ),

    attackingThirdPossessions:
      calculateAttackingThirdPossessions(
        events,
        side
      ),

    turnovers: calculateTurnovers(
      events,
      side
    ),

    // PASSING
    passAttempts,

    completedPasses,

    passingPercentage: percentage(
      completedPasses,
      passAttempts
    ),

    highestConsecutivePasses:
      passingStrings.highestConsecutivePasses,

    passStrings4Plus:
      passingStrings.passStrings4Plus,

    // BALL PROGRESSION
    carries10Plus:
      calculateCarries10Plus(
        events,
        side
      ),

    takeOnAttempts,

    successfulTakeOns,

    takeOnPercentage: percentage(
      successfulTakeOns,
      takeOnAttempts
    ),

    // DEFENDING
    possessionsWon:
      calculatePossessionsWon(
        events,
        side
      ),

    tackleAttempts,

    tacklesWon,

    tacklePercentage: percentage(
      tacklesWon,
      tackleAttempts
    ),

    blockedShots:
      calculateDefensiveBlockedShots(
        events,
        side
      ),

    pressures: calculatePressures(
      events,
      side
    ),
  };
}

/* =========================================================
   BACKWARDS-COMPATIBLE PLAYER HELPERS
   ========================================================= */

export function calculatePlayerTurnovers(
  events: InsightFCEvent[],
  playerId: string
) {
  return calculatePlayerStats(
    events,
    playerId
  ).turnovers;
}

export function calculatePlayerShots(
  events: InsightFCEvent[],
  playerId: string
) {
  return calculatePlayerStats(
    events,
    playerId
  ).shots;
}

export function calculatePlayerGoals(
  events: InsightFCEvent[],
  playerId: string
) {
  return calculatePlayerStats(
    events,
    playerId
  ).goals;
}

export function calculatePlayerShotsOnTarget(
  events: InsightFCEvent[],
  playerId: string
) {
  return calculatePlayerStats(
    events,
    playerId
  ).shotsOnTarget;
}

export function calculatePlayerPossessions(
  events: InsightFCEvent[],
  playerId: string
) {
  return calculatePlayerStats(
    events,
    playerId
  ).possessions;
}

export function calculatePlayerAttackingThirdPossessions(
  events: InsightFCEvent[],
  playerId: string
) {
  return calculatePlayerStats(
    events,
    playerId
  ).attackingThirdPossessions;
}
