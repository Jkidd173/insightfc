// lib/db.ts
// LocalStorage "database" for InsightFC (v1)
// Key: insightfc_db

export type GameStatus = "scheduled" | "in_progress" | "completed";

export type Team = {
  id: string;
  name: string;
  season?: string;
};

export type Player = {
  id: string;
  teamId: string;
  name: string;
  number?: string;
};

export type Game = {
  id: string;
  teamId: string;
  status: GameStatus;
  type: "scrimmage" | "game" | "tournament";
  date?: string;
  time?: string;
  opponent?: string;
  location?: string;
  homeAway?: "home" | "away";
};

export type Tag = {
  id: string;
  gameId: string;
  teamId: string;
  playerId?: string;
  type: string;
  minute: number;
  second: number;
  notes?: string;
  createdAt: number;
};

type DBv1 = {
  version: 1;
  teams: Team[];
  players: Player[];
  games: Game[];
  tags: Tag[];

  // Keeping these for compatibility in case you already have them in storage
  teamPlayers?: any[];
};

const LS_KEY = "insightfc_db";

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function emptyDB(): DBv1 {
  return {
    version: 1,
    teams: [],
    players: [],
    games: [],
    tags: [],
    teamPlayers: [],
  };
}

function safeParse(json: string | null): any {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function saveDB(db0: DBv1) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_KEY, JSON.stringify(db0));
}

/**
 * Migration:
 * Your app previously stored games in separate per-team keys like:
 * - insightfc:team:<teamId>:in_progress_games
 * - insightfc:team:<teamId>:completed_games
 * - insightfc:team:<teamId>:schedule_games (possible)
 *
 * Those lists are NOT the same as db.games.
 * This migrates them into db.games so Tagging can find them.
 */
function migrateLegacyTeamListsIntoDB(db0: DBv1) {
  if (typeof window === "undefined") return db0;

  const teamIds = db0.teams.map((t) => t.id);

  const legacyDefs: Array<{ suffix: string; status: GameStatus }> = [
    { suffix: "schedule_games", status: "scheduled" },
    { suffix: "in_progress_games", status: "in_progress" },
    { suffix: "completed_games", status: "completed" },
  ];

  let changed = false;

  for (const teamId of teamIds) {
    for (const def of legacyDefs) {
      const key = `insightfc:team:${teamId}:${def.suffix}`;
      const raw = window.localStorage.getItem(key);
      const parsed = safeParse(raw);

      if (!Array.isArray(parsed) || parsed.length === 0) continue;

      for (const legacyItem of parsed) {
        // Legacy items might look like:
        // { id, name, createdAt } or { id, opponent, date, time } etc.
        // We'll map safely.
        const legacyId: string | undefined = typeof legacyItem?.id === "string" ? legacyItem.id : undefined;

        // If it already exists in db.games, skip
        if (legacyId && db0.games.some((g) => g.id === legacyId)) continue;

        const opponent =
          (typeof legacyItem?.opponent === "string" && legacyItem.opponent) ||
          (typeof legacyItem?.name === "string" && legacyItem.name) ||
          undefined;

        const date = typeof legacyItem?.date === "string" ? legacyItem.date : undefined;
        const time = typeof legacyItem?.time === "string" ? legacyItem.time : undefined;
        const location = typeof legacyItem?.location === "string" ? legacyItem.location : undefined;

        const typeRaw = legacyItem?.type;
        const type: Game["type"] =
          typeRaw === "scrimmage" || typeRaw === "game" || typeRaw === "tournament"
            ? typeRaw
            : "game";

        const newGame: Game = {
          id: legacyId ?? makeId("game"),
          teamId,
          status: def.status,
          type,
          date,
          time,
          opponent,
          location,
        };

        db0.games.push(newGame);
        changed = true;
      }

      // Optional: once migrated, we can leave old keys alone.
      // (Safer for now: do NOT delete legacy keys.)
    }
  }

  if (changed) saveDB(db0);
  return db0;
}

function loadDB(): DBv1 {
  // If called on server by accident, return empty
  if (typeof window === "undefined") return emptyDB();

  const raw = window.localStorage.getItem(LS_KEY);
  const parsed = safeParse(raw);

  if (!parsed || typeof parsed !== "object") {
    const fresh = emptyDB();
    saveDB(fresh);
    return fresh;
  }

  const db0: DBv1 = {
    version: 1,
    teams: Array.isArray(parsed.teams) ? parsed.teams : [],
    players: Array.isArray(parsed.players) ? parsed.players : [],
    games: Array.isArray(parsed.games) ? parsed.games : [],
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    teamPlayers: Array.isArray(parsed.teamPlayers) ? parsed.teamPlayers : [],
  };

  // ✅ migrate legacy lists into db.games (one unified system)
  return migrateLegacyTeamListsIntoDB(db0);
}

export const db = {
  // ---- Teams ----
  getTeams(): Team[] {
    return loadDB().teams;
  },

  getTeam(teamId: string): Team | null {
    const db0 = loadDB();
    return db0.teams.find((t) => t.id === teamId) ?? null;
  },

  createTeam(input: { name: string; season?: string }) {
    const db0 = loadDB();
    const team: Team = {
      id: makeId("team"),
      name: input.name,
      season: input.season,
    };
    db0.teams.push(team);
    saveDB(db0);
    return team;
  },

  deleteTeam(teamId: string) {
    const db0 = loadDB();
    db0.teams = db0.teams.filter((t) => t.id !== teamId);
    db0.players = db0.players.filter((p) => p.teamId !== teamId);
    db0.games = db0.games.filter((g) => g.teamId !== teamId);
    db0.tags = db0.tags.filter((tag) => tag.teamId !== teamId);
    saveDB(db0);
  },

  // ---- Players ----
  getPlayers(): Player[] {
    return loadDB().players;
  },

  getPlayersForTeam(teamId: string): Player[] {
    const db0 = loadDB();
    return db0.players.filter((p) => p.teamId === teamId);
  },

  createPlayer(input: { teamId: string; name: string; number?: string }) {
    const db0 = loadDB();

    const player: Player = {
      id: makeId("player"),
      teamId: input.teamId,
      name: input.name,
      number: input.number,
    };

    db0.players.push(player);
    saveDB(db0);
    return player;
  },

  deletePlayer(playerId: string) {
    const db0 = loadDB();
    db0.players = db0.players.filter((p) => p.id !== playerId);

    // Optional: also remove playerId from existing tags (keeps tags but unassigned)
    db0.tags = db0.tags.map((t) => (t.playerId === playerId ? { ...t, playerId: undefined } : t));

    saveDB(db0);
  },

  // ---- Games ----
  getGames(): Game[] {
    return loadDB().games;
  },

  getGamesForTeam(teamId: string): Game[] {
    const db0 = loadDB();
    return db0.games.filter((g) => g.teamId === teamId);
  },

  getGame(gameId: string): Game | null {
    const db0 = loadDB();
    return db0.games.find((g) => g.id === gameId) ?? null;
  },

  createGame(input: {
    teamId: string;
    type: "scrimmage" | "game" | "tournament";
    date?: string;
    time?: string;
    opponent?: string;
    location?: string;
    homeAway?: "home" | "away";
  }) {
    const db0 = loadDB();

    const game: Game = {
      id: makeId("game"),
      teamId: input.teamId,
      status: "scheduled",
      type: input.type,
      date: input.date,
      time: input.time,
      opponent: input.opponent,
      location: input.location,
      homeAway: input.homeAway,
    };

    db0.games.push(game);
    saveDB(db0);
    return game;
  },

  updateGame(gameId: string, patch: Partial<Omit<Game, "id">>) {
    const db0 = loadDB();
    db0.games = db0.games.map((g) => (g.id === gameId ? { ...g, ...patch } : g));
    saveDB(db0);
  },

  deleteGame(gameId: string) {
    const db0 = loadDB();
    db0.games = db0.games.filter((g) => g.id !== gameId);
    db0.tags = db0.tags.filter((t) => t.gameId !== gameId);
    saveDB(db0);
  },

  startGame(gameId: string) {
    const db0 = loadDB();
    db0.games = db0.games.map((g) => (g.id === gameId ? { ...g, status: "in_progress" } : g));
    saveDB(db0);
  },

  markGameCompleted(gameId: string) {
    const db0 = loadDB();
    db0.games = db0.games.map((g) => (g.id === gameId ? { ...g, status: "completed" } : g));
    saveDB(db0);
  },

  // ---- Tags ----
  getTags(): Tag[] {
    return loadDB().tags;
  },

  getTagsForGame(gameId: string): Tag[] {
    const db0 = loadDB();
    return db0.tags.filter((t) => t.gameId === gameId);
  },

  createTag(input: {
    gameId: string;
    teamId: string;
    playerId?: string;
    type: string;
    minute: number;
    second: number;
    notes?: string;
  }) {
    const db0 = loadDB();

    const tag: Tag = {
      id: makeId("tag"),
      gameId: input.gameId,
      teamId: input.teamId,
      playerId: input.playerId,
      type: input.type,
      minute: input.minute,
      second: input.second,
      notes: input.notes,
      createdAt: Date.now(),
    };

    db0.tags.push(tag);
    saveDB(db0);
    return tag;
  },

  deleteTag(tagId: string) {
    const db0 = loadDB();
    db0.tags = db0.tags.filter((t) => t.id !== tagId);
    saveDB(db0);
  },

  // ---- Utilities ----
  clearAll() {
    saveDB(emptyDB());
  },
};