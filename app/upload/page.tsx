"use client";

import { useMemo, useState } from "react";

type Half = "First Half" | "Second Half";
type GameSize = 7 | 9 | 11;

type VideoPart = {
  id: string;
  file: File;
  half: Half;
};

type Player = {
  id: number;
  name: string;
  number: number;
  position: string;
};

type PitchPlayer = Player & {
  x: number;
  y: number;
};

const roster: Player[] = [
  { id: 1, name: "Eli Carter", number: 10, position: "CM" },
  { id: 2, name: "Noah Brooks", number: 7, position: "RW" },
  { id: 3, name: "Liam Reed", number: 8, position: "CM" },
  { id: 4, name: "Mason Lee", number: 4, position: "CB" },
  { id: 5, name: "Jack Miller", number: 9, position: "ST" },
  { id: 6, name: "Owen Clark", number: 11, position: "LW" },
  { id: 7, name: "Lucas Hall", number: 6, position: "CM" },
  { id: 8, name: "Henry Davis", number: 5, position: "CB" },
  { id: 9, name: "Caleb Young", number: 3, position: "LB" },
  { id: 10, name: "Ben Walker", number: 2, position: "RB" },
  { id: 11, name: "Sam Turner", number: 1, position: "GK" },
  { id: 12, name: "Leo Adams", number: 14, position: "CM" },
];

const startingPositions = [
  { x: 50, y: 89 },
  { x: 27, y: 73 },
  { x: 50, y: 73 },
  { x: 73, y: 73 },
  { x: 25, y: 52 },
  { x: 50, y: 55 },
  { x: 75, y: 52 },
  { x: 28, y: 32 },
  { x: 50, y: 36 },
  { x: 72, y: 32 },
  { x: 50, y: 15 },
];

export default function UploadMatchPage() {
  const [opponent, setOpponent] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [environment, setEnvironment] = useState("Outdoor");
  const [matchType, setMatchType] = useState("League");
  const [location, setLocation] = useState("");
  const [halfLength, setHalfLength] = useState("30");

  const [gameSize, setGameSize] = useState<GameSize>(7);
  const [lineup, setLineup] = useState<PitchPlayer[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] =
    useState<number | null>(null);

  const [videos, setVideos] = useState<VideoPart[]>([]);
  const [message, setMessage] = useState("");

  const bench = roster.filter(
    (player) => !lineup.some((starter) => starter.id === player.id)
  );

  const totalSize = useMemo(() => {
    return videos.reduce((sum, video) => sum + video.file.size, 0);
  }, [videos]);

  function formatSize(bytes: number) {
    if (!bytes) return "0 GB";
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  }

  function changeGameSize(size: GameSize) {
    if (lineup.length > size) {
      setMessage(
        `Move ${lineup.length - size} player${
          lineup.length - size === 1 ? "" : "s"
        } to the bench before switching to ${size}v${size}.`
      );
      return;
    }

    setGameSize(size);
    setMessage("");
  }

  function addStarter(player: Player) {
    if (lineup.length >= gameSize) {
      setMessage(
        `A ${gameSize}v${gameSize} starting lineup contains ${gameSize} players.`
      );
      return;
    }

    const position =
      startingPositions[lineup.length] ?? startingPositions[0];

    setLineup((current) => [
      ...current,
      {
        ...player,
        x: position.x,
        y: position.y,
      },
    ]);

    setSelectedPlayerId(player.id);
    setMessage("");
  }

  function moveToBench(playerId: number) {
    setLineup((current) =>
      current.filter((player) => player.id !== playerId)
    );

    if (selectedPlayerId === playerId) {
      setSelectedPlayerId(null);
    }

    setMessage("");
  }

  function moveSelectedPlayer(x: number, y: number) {
    if (selectedPlayerId === null) return;

    setLineup((current) =>
      current.map((player) =>
        player.id === selectedPlayerId
          ? {
              ...player,
              x: Math.max(8, Math.min(92, x)),
              y: Math.max(7, Math.min(93, y)),
            }
          : player
      )
    );
  }

  function handlePitchClick(
    event: React.MouseEvent<HTMLDivElement>
  ) {
    if (selectedPlayerId === null) return;

    const rect = event.currentTarget.getBoundingClientRect();

    const x =
      ((event.clientX - rect.left) / rect.width) * 100;

    const y =
      ((event.clientY - rect.top) / rect.height) * 100;

    moveSelectedPlayer(x, y);
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;

    const incoming = Array.from(files);

    if (videos.length + incoming.length > 4) {
      setMessage("A match can contain up to 4 video files.");
      return;
    }

    const nextVideos: VideoPart[] = incoming.map(
      (file, index) => ({
        id: `${file.name}-${file.size}-${Date.now()}-${index}`,
        file,
        half:
          videos.length + index < 2
            ? "First Half"
            : "Second Half",
      })
    );

    setVideos((current) => [...current, ...nextVideos]);
    setMessage("");
  }

  function removeVideo(id: string) {
    setVideos((current) =>
      current.filter((video) => video.id !== id)
    );
    setMessage("");
  }

  function changeHalf(id: string, half: Half) {
    setVideos((current) =>
      current.map((video) =>
        video.id === id ? { ...video, half } : video
      )
    );
  }

  function moveVideo(index: number, direction: -1 | 1) {
    const newIndex = index + direction;

    if (newIndex < 0 || newIndex >= videos.length) return;

    const reordered = [...videos];
    const temp = reordered[index];
    reordered[index] = reordered[newIndex];
    reordered[newIndex] = temp;

    setVideos(reordered);
  }

  function processMatch() {
    if (!opponent.trim()) {
      setMessage(
        "Enter the opponent before processing the match."
      );
      return;
    }

    if (!matchDate) {
      setMessage("Choose the match date.");
      return;
    }

    if (!location.trim()) {
      setMessage("Enter the match location.");
      return;
    }

    if (lineup.length !== gameSize) {
      setMessage(
        `Complete the ${gameSize}v${gameSize} starting lineup. You currently have ${lineup.length} of ${gameSize} starters selected.`
      );
      return;
    }

    if (videos.length < 1) {
      setMessage("Upload at least 1 match video.");
      return;
    }

    if (videos.length > 1) {
      const hasFirstHalf = videos.some(
        (video) => video.half === "First Half"
      );

      const hasSecondHalf = videos.some(
        (video) => video.half === "Second Half"
      );

      if (!hasFirstHalf || !hasSecondHalf) {
        setMessage(
          "Assign at least one video to the First Half and one to the Second Half."
        );
        return;
      }
    }

    setMessage(
      "Match setup complete. Video storage and analysis will be connected next."
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
        <div className="mb-10">
          <div className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-yellow-400">
            InsightFC
          </div>

          <h1 className="text-3xl font-black tracking-tight md:text-5xl">
            New Match
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
            Set up the match, starting lineup, and original game
            videos. InsightFC will turn the match into player actions,
            stats, timestamps, and clips.
          </p>
        </div>

        {/* STEP 1 */}

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 md:p-6">
          <div className="mb-6">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
              Step 1
            </div>
            <h2 className="mt-1 text-xl font-bold">
              Match Details
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-zinc-300">
                Team
              </span>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300">
                Northside U10
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-zinc-300">
                Opponent
              </span>
              <input
                value={opponent}
                onChange={(event) =>
                  setOpponent(event.target.value)
                }
                placeholder="e.g. Riverside U10"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-yellow-400"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-zinc-300">
                Match Date
              </span>
              <input
                type="date"
                value={matchDate}
                onChange={(event) =>
                  setMatchDate(event.target.value)
                }
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-yellow-400"
              />
            </label>

            <div>
              <span className="mb-2 block text-sm font-semibold text-zinc-300">
                Environment
              </span>

              <div className="grid grid-cols-2 gap-2">
                {["Outdoor", "Indoor"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setEnvironment(option)}
                    className={`rounded-xl border px-4 py-3 text-sm font-bold ${
                      environment === option
                        ? "border-yellow-400 bg-yellow-400 text-black"
                        : "border-zinc-800 bg-zinc-900 text-zinc-300"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-zinc-300">
                Match Type
              </span>
              <select
                value={matchType}
                onChange={(event) =>
                  setMatchType(event.target.value)
                }
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-yellow-400"
              >
                <option>League</option>
                <option>Tournament</option>
                <option>Scrimmage</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-zinc-300">
                Location
              </span>
              <input
                value={location}
                onChange={(event) =>
                  setLocation(event.target.value)
                }
                placeholder="e.g. Oakland Yard"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-yellow-400"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-zinc-300">
                Length of Each Half
              </span>
              <select
                value={halfLength}
                onChange={(event) =>
                  setHalfLength(event.target.value)
                }
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-yellow-400"
              >
                <option value="20">20 minutes</option>
                <option value="25">25 minutes</option>
                <option value="30">30 minutes</option>
                <option value="35">35 minutes</option>
                <option value="40">40 minutes</option>
                <option value="45">45 minutes</option>
              </select>
            </label>

            <div className="rounded-xl border border-zinc-800 bg-black p-4">
              <div className="text-sm font-semibold">
                Match Format
              </div>
              <div className="mt-1 text-sm text-zinc-400">
                2 halves • {halfLength} minutes each
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                {environment} • {matchType}
              </div>
            </div>
          </div>
        </section>

        {/* STEP 2 */}

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 md:p-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                Step 2
              </div>

              <h2 className="mt-1 text-xl font-bold">
                Starting Lineup
              </h2>

              <p className="mt-2 text-sm text-zinc-400">
                Choose the match format, add starters from your
                roster, then position them anywhere on the field.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex rounded-xl border border-zinc-800 bg-black p-1">
                {([7, 9, 11] as GameSize[]).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => changeGameSize(size)}
                    className={`rounded-lg px-4 py-2 text-xs font-black transition ${
                      gameSize === size
                        ? "bg-yellow-400 text-black"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {size}v{size}
                  </button>
                ))}
              </div>

              <div className="rounded-full border border-zinc-800 bg-black px-4 py-2 text-sm font-bold">
                <span className="text-yellow-400">
                  {lineup.length}
                </span>
                <span className="text-zinc-500">
                  {" "}
                  / {gameSize} starters
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
            <div>
              <div
                onClick={handlePitchClick}
                className="relative aspect-[0.72] max-h-[700px] w-full cursor-crosshair overflow-hidden rounded-2xl border-2 border-white/30 bg-[#315f2d]"
              >
                <div className="pointer-events-none absolute inset-[3%] border-2 border-white/25" />

                <div className="pointer-events-none absolute left-[3%] right-[3%] top-1/2 border-t-2 border-white/25" />

                <div className="pointer-events-none absolute left-1/2 top-1/2 h-[18%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/25" />

                <div className="pointer-events-none absolute left-1/2 top-[3%] h-[16%] w-[42%] -translate-x-1/2 border-2 border-t-0 border-white/25" />

                <div className="pointer-events-none absolute bottom-[3%] left-1/2 h-[16%] w-[42%] -translate-x-1/2 border-2 border-b-0 border-white/25" />

                <div className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30" />

                {lineup.map((player) => {
                  const selected =
                    selectedPlayerId === player.id;

                  return (
                    <button
                      key={player.id}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedPlayerId(player.id);
                      }}
                      style={{
                        left: `${player.x}%`,
                        top: `${player.y}%`,
                      }}
                      className="absolute -translate-x-1/2 -translate-y-1/2"
                    >
                      <div
                        className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 text-sm font-black shadow-lg transition md:h-14 md:w-14 ${
                          selected
                            ? "scale-110 border-yellow-300 bg-yellow-400 text-black"
                            : "border-white bg-zinc-950 text-white"
                        }`}
                      >
                        {player.number}
                      </div>

                      <div
                        className={`mt-1 whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-bold shadow md:text-xs ${
                          selected
                            ? "bg-yellow-400 text-black"
                            : "bg-black/80 text-white"
                        }`}
                      >
                        {player.name.split(" ")[0]}
                      </div>
                    </button>
                  );
                })}

                {lineup.length === 0 && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="rounded-xl bg-black/70 px-5 py-3 text-center">
                      <div className="font-bold">
                        Add players from your roster →
                      </div>
                      <div className="mt-1 text-xs text-zinc-400">
                        Then position them anywhere on the field.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {selectedPlayerId !== null && (
                <div className="mt-3 flex items-center justify-between rounded-xl border border-yellow-400/40 bg-yellow-400/10 px-4 py-3">
                  <div className="text-sm">
                    <span className="font-bold text-yellow-400">
                      Player selected.
                    </span>{" "}
                    <span className="text-zinc-300">
                      Click the field to move them.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedPlayerId(null)}
                    className="text-xs font-bold text-zinc-400 hover:text-white"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="font-bold">Saved Roster</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    Tap + to add a starter
                  </div>
                </div>

                <div className="text-xs text-zinc-500">
                  {bench.length} available
                </div>
              </div>

              <div className="max-h-[620px] space-y-2 overflow-y-auto pr-1">
                {lineup.map((player) => (
                  <div
                    key={`starter-${player.id}`}
                    className="flex items-center gap-3 rounded-xl border border-yellow-400/40 bg-yellow-400/10 p-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-xs font-black text-black">
                      {player.number}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold">
                        {player.name}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {player.position} • Starter
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => moveToBench(player.id)}
                      className="rounded-lg border border-zinc-700 px-2.5 py-2 text-xs font-bold text-zinc-300 hover:border-white"
                    >
                      Bench
                    </button>
                  </div>
                ))}

                {bench.map((player) => (
                  <div
                    key={`bench-${player.id}`}
                    className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-xs font-black">
                      {player.number}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold">
                        {player.name}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {player.position}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => addStarter(player)}
                      disabled={lineup.length >= gameSize}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-400 text-xl font-black text-black disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* STEP 3 */}

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 md:p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                Step 3
              </div>
              <h2 className="mt-1 text-xl font-bold">
                Match Videos
              </h2>
            </div>

            <div className="text-right text-xs text-zinc-500">
              <div>{videos.length}/4 files</div>
              <div>{formatSize(totalSize)}</div>
            </div>
          </div>

          <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-700 bg-black px-6 text-center transition hover:border-yellow-400">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 text-2xl font-black text-black">
              +
            </div>

            <div className="font-bold">Add Match Videos</div>

            <div className="mt-2 max-w-sm text-sm leading-5 text-zinc-500">
              Select 1–4 original videos from your phone or XbotGo.
              You do not need to combine multiple files first.
            </div>

            <input
              type="file"
              accept="video/*"
              multiple
              className="hidden"
              onChange={(event) => {
                handleFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </label>

          {videos.length > 0 && (
            <div className="mt-6 space-y-3">
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
                Video Order
              </div>

              {videos.map((video, index) => (
                <div
                  key={video.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
                >
                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-sm font-black text-black">
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">
                        {video.file.name}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {(video.file.size / 1024 / 1024).toFixed(0)}{" "}
                        MB
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeVideo(video.id)}
                      className="text-xs font-semibold text-zinc-500 hover:text-white"
                    >
                      Remove
                    </button>
                  </div>

                  {videos.length > 1 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <select
                        value={video.half}
                        onChange={(event) =>
                          changeHalf(
                            video.id,
                            event.target.value as Half
                          )
                        }
                        className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-xs font-semibold"
                      >
                        <option>First Half</option>
                        <option>Second Half</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => moveVideo(index, -1)}
                        disabled={index === 0}
                        className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold disabled:opacity-30"
                      >
                        Move Up
                      </button>

                      <button
                        type="button"
                        onClick={() => moveVideo(index, 1)}
                        disabled={index === videos.length - 1}
                        className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold disabled:opacity-30"
                      >
                        Move Down
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 rounded-xl border border-zinc-800 bg-black p-4">
            <div className="text-sm font-semibold">
              One video or multiple files — both work.
            </div>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Multiple recordings will ultimately be treated as one
              continuous match.
            </p>
          </div>
        </section>

        {/* STEP 4 */}

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 md:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                Step 4
              </div>

              <h2 className="mt-1 text-xl font-bold">
                Process Match
              </h2>

              <p className="mt-2 max-w-2xl text-sm text-zinc-400">
                InsightFC will use the match details, starting lineup,
                and video to create player actions, stats, timestamps,
                and clips.
              </p>
            </div>

            <button
              type="button"
              onClick={processMatch}
              className="shrink-0 rounded-xl bg-yellow-400 px-7 py-3.5 text-sm font-black text-black hover:bg-yellow-300"
            >
              Process Match →
            </button>
          </div>

          {message && (
            <div className="mt-5 rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">
              {message}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
