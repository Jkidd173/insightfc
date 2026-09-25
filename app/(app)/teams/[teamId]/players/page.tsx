"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type PlayerStatus = "active" | "guest" | "inactive";

type Player = {
  id: string;
  team_id: string;
  name: string;
  jersey_number: string | number | null;
  birth_year: number | null;
  position: string | null;
  primary_foot: string | null;
  status: PlayerStatus;
};

const positions = [
  "Goalkeeper",
  "Defender",
  "Midfielder",
  "Forward",
];

const birthYears = Array.from(
  { length: 18 },
  (_, index) => new Date().getFullYear() - 4 - index
);

export default function PlayersPage() {
  const params = useParams();
  const teamId = params.teamId as string;

  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [position, setPosition] = useState("");
  const [primaryFoot, setPrimaryFoot] = useState("");

  const [playerToDelete, setPlayerToDelete] =
    useState<Player | null>(null);

  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const loadPlayers = useCallback(async () => {
    if (!teamId) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/players?teamId=${encodeURIComponent(teamId)}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(
          result.error || "Unable to load players."
        );
      }

      setPlayers(result.data ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load players."
      );
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  async function addPlayer() {
    if (
      !name.trim() ||
      !number.trim() ||
      !birthYear ||
      !position ||
      !primaryFoot ||
      saving
    ) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/players", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamId,
          name: name.trim(),
          jerseyNumber: number.trim(),
          birthYear: Number(birthYear),
          position,
          primaryFoot,
          status: "active",
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(
          result.error || "Unable to add player."
        );
      }

      setName("");
      setNumber("");
      setBirthYear("");
      setPosition("");
      setPrimaryFoot("");

      await loadPlayers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to add player."
      );
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(
    playerId: string,
    status: PlayerStatus
  ) {
    setError("");

    try {
      const response = await fetch("/api/players", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId,
          status,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(
          result.error || "Unable to update player."
        );
      }

      setPlayers((current) =>
        current.map((player) =>
          player.id === playerId
            ? { ...player, status }
            : player
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update player."
      );
    }
  }

  function openDelete(player: Player) {
    setPlayerToDelete(player);
    setDeleteText("");
    setError("");
  }

  function closeDelete() {
    if (deleting) return;

    setPlayerToDelete(null);
    setDeleteText("");
  }

  async function permanentlyDeletePlayer() {
    if (
      !playerToDelete ||
      deleteText !== "delete" ||
      deleting
    ) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const response = await fetch("/api/players", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId: playerToDelete.id,
          confirmation: deleteText,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(
          result.error || "Unable to remove player."
        );
      }

      setPlayers((current) =>
        current.filter(
          (player) => player.id !== playerToDelete.id
        )
      );

      setPlayerToDelete(null);
      setDeleteText("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to remove player."
      );
    } finally {
      setDeleting(false);
    }
  }

  const activePlayers = players.filter(
    (player) => player.status === "active"
  );

  const guestPlayers = players.filter(
    (player) => player.status === "guest"
  );

  const inactivePlayers = players.filter(
    (player) => player.status === "inactive"
  );

  function renderPlayer(player: Player) {
    const details = [
      player.birth_year
        ? `Born ${player.birth_year}`
        : null,
      player.position,
      player.primary_foot
        ? `${player.primary_foot} foot`
        : null,
    ].filter(Boolean);

    return (
      <div
        key={player.id}
        className="card flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="truncate text-lg font-bold text-white">
              {player.jersey_number
                ? `#${player.jersey_number} `
                : ""}
              {player.name}
            </div>

            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
                player.status === "active"
                  ? "border-green-500/20 bg-green-500/10 text-green-300"
                  : player.status === "guest"
                    ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-300"
                    : "border-zinc-600 bg-zinc-800 text-zinc-400"
              }`}
            >
              {player.status}
            </span>
          </div>

          <p className="mt-1 text-sm text-zinc-500">
            {details.length
              ? details.join(" • ")
              : "Player details not set"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={player.status === "active"}
            onClick={() =>
              changeStatus(player.id, "active")
            }
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-zinc-300 transition hover:border-green-500/30 hover:text-green-300 disabled:cursor-default disabled:opacity-30"
          >
            Active
          </button>

          <button
            type="button"
            disabled={player.status === "guest"}
            onClick={() =>
              changeStatus(player.id, "guest")
            }
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-zinc-300 transition hover:border-yellow-400/30 hover:text-yellow-300 disabled:cursor-default disabled:opacity-30"
          >
            Guest
          </button>

          <button
            type="button"
            disabled={player.status === "inactive"}
            onClick={() =>
              changeStatus(player.id, "inactive")
            }
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-zinc-300 transition hover:border-zinc-500 hover:text-white disabled:cursor-default disabled:opacity-30"
          >
            Inactive
          </button>

          <button
            type="button"
            onClick={() => openDelete(player)}
            className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-bold text-red-300 transition hover:bg-red-500/10"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <div className="eyebrow">Team roster</div>

        <h1 className="page-title mt-2">Players</h1>

        <p className="muted mt-2">
          Manage your active roster, guest players, and inactive
          players.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <section className="card space-y-5">
        <div>
          <h2 className="text-xl font-bold text-white">
            Add player
          </h2>

          <p className="muted mt-1 text-sm">
            Add a player profile to the active roster.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">
              Player name
            </label>

            <input
              className="input w-full"
              placeholder="Player name"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">
              Jersey #
            </label>

            <input
              className="input w-full"
              placeholder="Jersey #"
              inputMode="numeric"
              value={number}
              onChange={(event) =>
                setNumber(event.target.value)
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">
              Birth year
            </label>

            <select
              className="input w-full"
              value={birthYear}
              onChange={(event) =>
                setBirthYear(event.target.value)
              }
            >
              <option value="">Select year</option>

              {birthYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">
              Position
            </label>

            <select
              className="input w-full"
              value={position}
              onChange={(event) =>
                setPosition(event.target.value)
              }
            >
              <option value="">Select position</option>

              {positions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">
              Primary foot
            </label>

            <select
              className="input w-full"
              value={primaryFoot}
              onChange={(event) =>
                setPrimaryFoot(event.target.value)
              }
            >
              <option value="">Select foot</option>
              <option value="Right">Right</option>
              <option value="Left">Left</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          className="btn-yellow"
          disabled={
            !name.trim() ||
            !number.trim() ||
            !birthYear ||
            !position ||
            !primaryFoot ||
            saving
          }
          onClick={addPlayer}
        >
          {saving ? "Adding Player..." : "+ Add Player"}
        </button>

        <p className="text-xs text-zinc-500">
          All fields are required. New players are added as Active.
        </p>
      </section>

      {loading ? (
        <div className="card">
          <p className="muted">Loading roster...</p>
        </div>
      ) : players.length === 0 ? (
        <div className="card py-12 text-center">
          <h2 className="text-xl font-bold text-white">
            No players yet
          </h2>

          <p className="muted mt-2">
            Add your first player above to begin building the
            roster.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <section className="space-y-3">
            <div>
              <h2 className="text-xl font-bold text-white">
                Active Roster ({activePlayers.length})
              </h2>

              <p className="muted mt-1 text-sm">
                Regular players currently on the team.
              </p>
            </div>

            {activePlayers.length ? (
              activePlayers.map(renderPlayer)
            ) : (
              <div className="card text-sm text-zinc-500">
                No active players.
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-xl font-bold text-white">
                Guest Players ({guestPlayers.length})
              </h2>

              <p className="muted mt-1 text-sm">
                Players temporarily available for this team.
              </p>
            </div>

            {guestPlayers.length ? (
              guestPlayers.map(renderPlayer)
            ) : (
              <div className="card text-sm text-zinc-500">
                No guest players.
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-xl font-bold text-white">
                Inactive ({inactivePlayers.length})
              </h2>

              <p className="muted mt-1 text-sm">
                Players kept for historical records but not on the
                current roster.
              </p>
            </div>

            {inactivePlayers.length ? (
              inactivePlayers.map(renderPlayer)
            ) : (
              <div className="card text-sm text-zinc-500">
                No inactive players.
              </div>
            )}
          </section>
        </div>
      )}

      {playerToDelete && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-5 py-10 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDelete();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-3xl border border-red-500/20 bg-[#0b0b0c] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.8)] sm:p-7"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-xl font-black text-red-400">
              !
            </div>

            <h2 className="text-2xl font-black text-white">
              Remove {playerToDelete.name}?
            </h2>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              This permanently removes this player from the
              InsightFC roster. This action cannot be undone.
            </p>

            <div className="mt-5 rounded-xl border border-yellow-400/20 bg-yellow-400/[0.06] p-4">
              <div className="text-sm font-bold text-yellow-300">
                Consider Inactive instead
              </div>

              <p className="mt-1 text-xs leading-5 text-zinc-400">
                If this player has previous match history, use
                Inactive instead to keep the player on record.
              </p>
            </div>

            <label className="mt-6 block">
              <span className="block text-sm font-semibold text-zinc-300">
                Type{" "}
                <span className="font-black text-white">
                  delete
                </span>{" "}
                to confirm
              </span>

              <input
                className="input mt-2 w-full"
                value={deleteText}
                disabled={deleting}
                autoComplete="off"
                spellCheck={false}
                placeholder="delete"
                onChange={(event) =>
                  setDeleteText(event.target.value)
                }
              />
            </label>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={closeDelete}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  deleteText !== "delete" || deleting
                }
                onClick={permanentlyDeletePlayer}
                className="rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-600"
              >
                {deleting
                  ? "Removing..."
                  : "Confirm Remove"}
              </button>
            </div>

            {deleteText !== "delete" && (
              <p className="mt-3 text-center text-xs text-zinc-600">
                Confirm Remove will unlock after you type delete.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
