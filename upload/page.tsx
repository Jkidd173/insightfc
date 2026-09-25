"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

type Half = "First Half" | "Second Half";
type GameSize = 7 | 9 | 11;
type UploadStatus = "ready" | "uploading" | "complete" | "error";

type Team = {
  id: string;
  name: string;
  season?: string | null;
};

type Player = {
  id: string;
  name: string;
  number: number;
  position: string;
};

type PitchPlayer = Player & {
  x: number;
  y: number;
};

type VideoPart = {
  id: string;
  file: File;
  half: Half;
  status: UploadStatus;
  storagePath?: string;
};

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
  const router = useRouter();

  const [teams, setTeams] = useState<Team[]>([]);
  const [teamId, setTeamId] = useState("");
  const [roster, setRoster] = useState<Player[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);

  const [opponent, setOpponent] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [environment, setEnvironment] = useState("Outdoor");
  const [matchType, setMatchType] = useState("League");
  const [location, setLocation] = useState("");
  const [halfLength, setHalfLength] = useState("30");

  const [teamScore, setTeamScore] = useState("");
  const [opponentScore, setOpponentScore] = useState("");

  const [teamJerseyColor, setTeamJerseyColor] =
    useState("#facc15");
  const [opponentJerseyColor, setOpponentJerseyColor] =
    useState("#ffffff");

  const [gameSize, setGameSize] = useState<GameSize>(7);
  const [lineup, setLineup] = useState<PitchPlayer[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] =
    useState<string | null>(null);

  const [videos, setVideos] = useState<VideoPart[]>([]);
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [currentUpload, setCurrentUpload] = useState(0);

  const selectedTeam = teams.find((team) => team.id === teamId);

  const bench = roster.filter(
    (player) =>
      !lineup.some((starter) => starter.id === player.id)
  );

  const totalSize = useMemo(() => {
    return videos.reduce(
      (sum, video) => sum + video.file.size,
      0
    );
  }, [videos]);

  useEffect(() => {
    async function loadTeams() {
      try {
        setLoadingTeams(true);

        const response = await fetch("/api/teams", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok || !result.ok) {
          throw new Error(
            result.error || "Could not load your teams."
          );
        }

        const loadedTeams: Team[] = result.data ?? [];

        setTeams(loadedTeams);

        if (loadedTeams.length === 1) {
          setTeamId(loadedTeams[0].id);
        }
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Could not load your teams."
        );
      } finally {
        setLoadingTeams(false);
      }
    }

    loadTeams();
  }, []);

  useEffect(() => {
    async function loadRoster() {
      if (!teamId) {
        setRoster([]);
        setLineup([]);
        return;
      }

      try {
        setLoadingRoster(true);
        setRoster([]);
        setLineup([]);
        setSelectedPlayerId(null);

        const response = await fetch(
          `/api/players?teamId=${encodeURIComponent(teamId)}`,
          {
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!response.ok || !result.ok) {
          throw new Error(
            result.error || "Could not load this team's roster."
          );
        }

        const players: Player[] = (result.data ?? [])
          .filter(
            (player: {
              status?: string | null;
            }) =>
              !player.status ||
              player.status === "active" ||
              player.status === "guest"
          )
          .map(
            (player: {
              id: string;
              name: string;
              jersey_number?: string | number | null;
              position?: string | null;
            }) => ({
              id: player.id,
              name: player.name,
              number:
                Number(player.jersey_number) || 0,
              position: player.position || "Player",
            })
          );

        setRoster(players);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Could not load this team's roster."
        );
      } finally {
        setLoadingRoster(false);
      }
    }

    loadRoster();
  }, [teamId]);

  function formatSize(bytes: number) {
    if (!bytes) return "0 GB";

    if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / 1024 / 1024).toFixed(0)} MB`;
    }

    return `${(bytes / 1024 / 1024 / 1024).toFixed(
      2
    )} GB`;
  }

  function cleanFileName(name: string) {
    return name
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-");
  }

  function changeGameSize(size: GameSize) {
    if (isUploading) return;

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
    if (isUploading) return;

    if (lineup.length >= gameSize) {
      setMessage(
        `A ${gameSize}v${gameSize} starting lineup contains ${gameSize} players.`
      );
      return;
    }

    const position =
      startingPositions[lineup.length] ??
      startingPositions[0];

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

  function moveToBench(playerId: string) {
    if (isUploading) return;

    setLineup((current) =>
      current.filter((player) => player.id !== playerId)
    );

    if (selectedPlayerId === playerId) {
      setSelectedPlayerId(null);
    }

    setMessage("");
  }

  function moveSelectedPlayer(x: number, y: number) {
    if (selectedPlayerId === null || isUploading) return;

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
    if (selectedPlayerId === null || isUploading) return;

    const rect =
      event.currentTarget.getBoundingClientRect();

    const x =
      ((event.clientX - rect.left) / rect.width) * 100;

    const y =
      ((event.clientY - rect.top) / rect.height) * 100;

    moveSelectedPlayer(x, y);
  }

  function handleFiles(files: FileList | null) {
    if (!files || isUploading) return;

    const incoming = Array.from(files);

    if (videos.length + incoming.length > 4) {
      setMessage(
        "A match can contain up to 4 video files."
      );
      return;
    }

    const invalidFiles = incoming.filter(
      (file) => !file.type.startsWith("video/")
    );

    if (invalidFiles.length > 0) {
      setMessage("Please select video files only.");
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
        status: "ready",
      })
    );

    setVideos((current) => [
      ...current,
      ...nextVideos,
    ]);

    setMessage("");
  }

  function removeVideo(id: string) {
    if (isUploading) return;

    setVideos((current) =>
      current.filter((video) => video.id !== id)
    );

    setMessage("");
  }

  function changeHalf(id: string, half: Half) {
    if (isUploading) return;

    setVideos((current) =>
      current.map((video) =>
        video.id === id ? { ...video, half } : video
      )
    );
  }

  function moveVideo(index: number, direction: -1 | 1) {
    if (isUploading) return;

    const newIndex = index + direction;

    if (
      newIndex < 0 ||
      newIndex >= videos.length
    ) {
      return;
    }

    const reordered = [...videos];
    const temp = reordered[index];

    reordered[index] = reordered[newIndex];
    reordered[newIndex] = temp;

    setVideos(reordered);
  }

  function validateMatch() {
    if (!teamId) {
      setMessage("Choose your team.");
      return false;
    }

    if (!opponent.trim()) {
      setMessage(
        "Enter the opponent before processing the match."
      );
      return false;
    }

    if (!matchDate) {
      setMessage("Choose the match date.");
      return false;
    }

    if (teamScore === "" || opponentScore === "") {
      setMessage("Enter the final match score.");
      return false;
    }

    if (
      Number(teamScore) < 0 ||
      Number(opponentScore) < 0
    ) {
      setMessage("Match scores cannot be negative.");
      return false;
    }

    if (!location.trim()) {
      setMessage("Enter the match location.");
      return false;
    }

    if (lineup.length !== gameSize) {
      setMessage(
        `Complete the ${gameSize}v${gameSize} starting lineup. You currently have ${lineup.length} of ${gameSize} starters selected.`
      );
      return false;
    }

    if (videos.length < 1) {
      setMessage("Upload at least 1 match video.");
      return false;
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
        return false;
      }
    }

    return true;
  }

  async function processMatch() {
    if (isUploading) return;
    if (!validateMatch()) return;

    setMessage("Checking your InsightFC account...");

    const supabase = supabaseBrowser();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage(
        "You must be signed in to InsightFC before uploading match videos."
      );
      return;
    }

    setIsUploading(true);
    setCurrentUpload(0);

    let gameId = "";

    try {
      setMessage("Creating match...");

      const { data: game, error: gameError } =
        await supabase
          .from("games")
          .insert({
            team_id: teamId,
            status: "in_progress",
            type: "game",
            date: matchDate,
            opponent: opponent.trim(),
            location: location.trim(),
            home_away: "home",
            team_score: Number(teamScore),
            opponent_score: Number(opponentScore),
            team_jersey_color: teamJerseyColor,
            opponent_jersey_color:
              opponentJerseyColor,
          })
          .select("id")
          .single();

      if (gameError || !game) {
        throw new Error(
          gameError?.message ||
            "The match could not be created."
        );
      }

      gameId = game.id;

      const uploadedVideos: {
        name: string;
        path: string;
        half: Half;
        size: number;
        type: string;
      }[] = [];

      for (
        let index = 0;
        index < videos.length;
        index++
      ) {
        const video = videos[index];

        setCurrentUpload(index + 1);

        setVideos((current) =>
          current.map((item) =>
            item.id === video.id
              ? {
                  ...item,
                  status: "uploading",
                }
              : item
          )
        );

        setMessage(
          `Uploading video ${index + 1} of ${
            videos.length
          }: ${video.file.name}`
        );

        const fileName = cleanFileName(
          video.file.name
        );

        const storagePath = `${user.id}/${gameId}/${
          index + 1
        }-${fileName}`;

        const { error: uploadError } =
          await supabase.storage
            .from("match-videos")
            .upload(storagePath, video.file, {
              contentType:
                video.file.type ||
                "application/octet-stream",
              cacheControl: "3600",
              upsert: false,
            });

        if (uploadError) {
          setVideos((current) =>
            current.map((item) =>
              item.id === video.id
                ? {
                    ...item,
                    status: "error",
                  }
                : item
            )
          );

          throw new Error(
            `${video.file.name}: ${uploadError.message}`
          );
        }

        uploadedVideos.push({
          name: video.file.name,
          path: storagePath,
          half: video.half,
          size: video.file.size,
          type: video.file.type,
        });

        setVideos((current) =>
          current.map((item) =>
            item.id === video.id
              ? {
                  ...item,
                  status: "complete",
                  storagePath,
                }
              : item
          )
        );
      }

      const processingData = {
        matchId: gameId,
        teamId,
        team: selectedTeam?.name || "InsightFC Team",
        opponent: opponent.trim(),
        matchDate,
        environment,
        matchType,
        location: location.trim(),
        halfLength: Number(halfLength),
        gameSize,
        teamScore: Number(teamScore),
        opponentScore: Number(opponentScore),
        teamJerseyColor,
        opponentJerseyColor,
        lineup: lineup.map((player) => ({
          id: player.id,
          name: player.name,
          number: player.number,
          position: player.position,
          x: player.x,
          y: player.y,
        })),
        videos: uploadedVideos,
      };

      sessionStorage.setItem(
        "insightfc-processing-match",
        JSON.stringify(processingData)
      );

      setMessage(
        "Upload complete. Opening match processing..."
      );

      router.push("/processing");
    } catch (error) {
      console.error(
        "Match video upload failed:",
        error
      );

      setMessage(
        error instanceof Error
          ? `Upload failed: ${error.message}`
          : "Upload failed. Please try again."
      );

      setIsUploading(false);
      setCurrentUpload(0);
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            disabled={isUploading}
            onClick={() => router.back()}
            className="text-sm font-bold text-zinc-400 transition hover:text-white disabled:opacity-40"
          >
            ← Back
          </button>

          <button
            type="button"
            disabled={isUploading}
            onClick={() => router.push("/")}
            className="text-sm font-bold text-zinc-400 transition hover:text-white disabled:opacity-40"
          >
            Cancel
          </button>
        </div>

        <div className="mb-10">
          <div className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-yellow-400">
            InsightFC
          </div>

          <h1 className="text-3xl font-black tracking-tight md:text-5xl">
            New Match
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
            Set up the match, starting lineup, final
            result, jersey colors, and original game
            videos. InsightFC will turn the match into
            player actions, stats, timestamps, and clips.
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

              <select
                value={teamId}
                disabled={
                  loadingTeams || isUploading
                }
                onChange={(event) => {
                  setTeamId(event.target.value);
                  setMessage("");
                }}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-yellow-400 disabled:opacity-50"
              >
                <option value="">
                  {loadingTeams
                    ? "Loading teams..."
                    : "Choose a team"}
                </option>

                {teams.map((team) => (
                  <option
                    key={team.id}
                    value={team.id}
                  >
                    {team.name}
                    {team.season
                      ? ` — ${team.season}`
                      : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-zinc-300">
                Opponent
              </span>

              <input
                value={opponent}
                disabled={isUploading}
                onChange={(event) =>
                  setOpponent(event.target.value)
                }
                placeholder="e.g. Riverside U10"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-yellow-400 disabled:opacity-50"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-zinc-300">
                Match Date
              </span>

              <input
                type="date"
                value={matchDate}
                disabled={isUploading}
                onChange={(event) =>
                  setMatchDate(event.target.value)
                }
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-yellow-400 disabled:opacity-50"
              />
            </label>

            {/* FINAL SCORE */}

            <div className="rounded-xl border border-zinc-800 bg-black p-4 md:col-span-2 lg:col-span-3">
              <div className="text-sm font-semibold text-zinc-300">
                Final Score
              </div>

              <p className="mt-1 text-xs text-zinc-500">
                Enter the result so your team record and
                goals can update immediately.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <div className="min-w-[130px] flex-1">
                  <div className="mb-2 truncate text-xs font-bold text-zinc-400">
                    {selectedTeam?.name ||
                      "Your Team"}
                  </div>

                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={teamScore}
                    disabled={isUploading}
                    onChange={(event) =>
                      setTeamScore(
                        event.target.value
                      )
                    }
                    placeholder="0"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-center text-xl font-black outline-none focus:border-yellow-400 disabled:opacity-50"
                  />
                </div>

                <div className="pt-6 text-xl font-black text-zinc-600">
                  –
                </div>

                <div className="min-w-[130px] flex-1">
                  <div className="mb-2 truncate text-xs font-bold text-zinc-400">
                    {opponent.trim() ||
                      "Opponent"}
                  </div>

                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={opponentScore}
                    disabled={isUploading}
                    onChange={(event) =>
                      setOpponentScore(
                        event.target.value
                      )
                    }
                    placeholder="0"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-center text-xl font-black outline-none focus:border-yellow-400 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* JERSEY COLORS */}

            <div className="rounded-xl border border-zinc-800 bg-black p-4 md:col-span-2 lg:col-span-3">
              <div className="text-sm font-semibold text-zinc-300">
                Jersey Colors
              </div>

              <p className="mt-1 text-xs text-zinc-500">
                Click either color square to choose the
                jersey color worn in this match.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <div>
                    <div className="text-sm font-bold">
                      {selectedTeam?.name ||
                        "Your Team"}
                    </div>

                    <div className="mt-1 text-xs text-zinc-500">
                      Team jersey
                    </div>
                  </div>

                  <div className="relative">
                    <div
                      className="h-11 w-11 rounded-lg border-2 border-white/30 shadow"
                      style={{
                        backgroundColor:
                          teamJerseyColor,
                      }}
                    />

                    <input
                      type="color"
                      value={teamJerseyColor}
                      disabled={isUploading}
                      onChange={(event) =>
                        setTeamJerseyColor(
                          event.target.value
                        )
                      }
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </div>
                </label>

                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <div>
                    <div className="text-sm font-bold">
                      {opponent.trim() ||
                        "Opponent"}
                    </div>

                    <div className="mt-1 text-xs text-zinc-500">
                      Opponent jersey
                    </div>
                  </div>

                  <div className="relative">
                    <div
                      className="h-11 w-11 rounded-lg border-2 border-white/30 shadow"
                      style={{
                        backgroundColor:
                          opponentJerseyColor,
                      }}
                    />

                    <input
                      type="color"
                      value={opponentJerseyColor}
                      disabled={isUploading}
                      onChange={(event) =>
                        setOpponentJerseyColor(
                          event.target.value
                        )
                      }
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </div>
                </label>
              </div>
            </div>

            <div>
              <span className="mb-2 block text-sm font-semibold text-zinc-300">
                Environment
              </span>

              <div className="grid grid-cols-2 gap-2">
                {["Outdoor", "Indoor"].map(
                  (option) => (
                    <button
                      key={option}
                      type="button"
                      disabled={isUploading}
                      onClick={() =>
                        setEnvironment(option)
                      }
                      className={`rounded-xl border px-4 py-3 text-sm font-bold disabled:opacity-50 ${
                        environment === option
                          ? "border-yellow-400 bg-yellow-400 text-black"
                          : "border-zinc-800 bg-zinc-900 text-zinc-300"
                      }`}
                    >
                      {option}
                    </button>
                  )
                )}
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-zinc-300">
                Match Type
              </span>

              <select
                value={matchType}
                disabled={isUploading}
                onChange={(event) =>
                  setMatchType(event.target.value)
                }
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-yellow-400 disabled:opacity-50"
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
                disabled={isUploading}
                onChange={(event) =>
                  setLocation(event.target.value)
                }
                placeholder="e.g. Oakland Yard"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-yellow-400 disabled:opacity-50"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-zinc-300">
                Length of Each Half
              </span>

              <select
                value={halfLength}
                disabled={isUploading}
                onChange={(event) =>
                  setHalfLength(event.target.value)
                }
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-yellow-400 disabled:opacity-50"
              >
                <option value="20">
                  20 minutes
                </option>
                <option value="25">
                  25 minutes
                </option>
                <option value="30">
                  30 minutes
                </option>
                <option value="35">
                  35 minutes
                </option>
                <option value="40">
                  40 minutes
                </option>
                <option value="45">
                  45 minutes
                </option>
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
                Choose the match format, add starters
                from your saved roster, then position
                them anywhere on the field.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex rounded-xl border border-zinc-800 bg-black p-1">
                {([7, 9, 11] as GameSize[]).map(
                  (size) => (
                    <button
                      key={size}
                      type="button"
                      disabled={isUploading}
                      onClick={() =>
                        changeGameSize(size)
                      }
                      className={`rounded-lg px-4 py-2 text-xs font-black transition disabled:opacity-50 ${
                        gameSize === size
                          ? "bg-yellow-400 text-black"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      {size}v{size}
                    </button>
                  )
                )}
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

          {!teamId ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-black px-6 py-14 text-center">
              <div className="font-bold">
                Choose a team first
              </div>

              <div className="mt-2 text-sm text-zinc-500">
                Your saved roster will appear here.
              </div>
            </div>
          ) : loadingRoster ? (
            <div className="rounded-2xl border border-zinc-800 bg-black px-6 py-14 text-center text-sm text-zinc-400">
              Loading roster…
            </div>
          ) : (
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
                      selectedPlayerId ===
                      player.id;

                    return (
                      <button
                        key={player.id}
                        type="button"
                        disabled={isUploading}
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedPlayerId(
                            player.id
                          );
                        }}
                        style={{
                          left: `${player.x}%`,
                          top: `${player.y}%`,
                        }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 disabled:opacity-60"
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
                          Then position them anywhere on
                          the field.
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
                      disabled={isUploading}
                      onClick={() =>
                        setSelectedPlayerId(null)
                      }
                      className="text-xs font-bold text-zinc-400 hover:text-white disabled:opacity-50"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-black p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="font-bold">
                      Saved Roster
                    </div>

                    <div className="mt-1 text-xs text-zinc-500">
                      Tap + to add a starter
                    </div>
                  </div>

                  <div className="text-xs text-zinc-500">
                    {bench.length} available
                  </div>
                </div>

                {roster.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-800 px-4 py-10 text-center">
                    <div className="text-sm font-bold">
                      No active players yet
                    </div>

                    <div className="mt-2 text-xs leading-5 text-zinc-500">
                      Add players to this team's roster
                      before building the starting lineup.
                    </div>
                  </div>
                ) : (
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
                          disabled={isUploading}
                          onClick={() =>
                            moveToBench(player.id)
                          }
                          className="rounded-lg border border-zinc-700 px-2.5 py-2 text-xs font-bold text-zinc-300 hover:border-white disabled:opacity-50"
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
                          onClick={() =>
                            addStarter(player)
                          }
                          disabled={
                            lineup.length >= gameSize ||
                            isUploading
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-400 text-xl font-black text-black disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
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

          <label
            className={`flex min-h-44 flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-black px-6 text-center transition ${
              isUploading
                ? "cursor-not-allowed border-zinc-800 opacity-50"
                : "cursor-pointer border-zinc-700 hover:border-yellow-400"
            }`}
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 text-2xl font-black text-black">
              +
            </div>

            <div className="font-bold">
              Add Match Videos
            </div>

            <div className="mt-2 max-w-sm text-sm leading-5 text-zinc-500">
              Select 1–4 original videos from your phone
              or XbotGo. You do not need to combine
              multiple files first.
            </div>

            <input
              type="file"
              accept="video/*"
              multiple
              disabled={isUploading}
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
                  className={`rounded-xl border p-4 ${
                    video.status === "complete"
                      ? "border-green-500/30 bg-green-500/5"
                      : video.status === "error"
                      ? "border-red-500/40 bg-red-500/5"
                      : video.status ===
                        "uploading"
                      ? "border-yellow-400/50 bg-yellow-400/5"
                      : "border-zinc-800 bg-zinc-900"
                  }`}
                >
                  <div className="flex gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                        video.status === "complete"
                          ? "bg-green-500 text-black"
                          : video.status === "error"
                          ? "bg-red-500 text-white"
                          : "bg-yellow-400 text-black"
                      }`}
                    >
                      {video.status === "complete"
                        ? "✓"
                        : video.status === "error"
                        ? "!"
                        : index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">
                        {video.file.name}
                      </div>

                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500">
                        <span>
                          {formatSize(
                            video.file.size
                          )}
                        </span>

                        {video.status === "ready" && (
                          <span>
                            Ready to upload
                          </span>
                        )}

                        {video.status ===
                          "uploading" && (
                          <span className="font-semibold text-yellow-400">
                            Uploading…
                          </span>
                        )}

                        {video.status ===
                          "complete" && (
                          <span className="font-semibold text-green-400">
                            Uploaded securely
                          </span>
                        )}

                        {video.status === "error" && (
                          <span className="font-semibold text-red-400">
                            Upload failed
                          </span>
                        )}
                      </div>
                    </div>

                    {!isUploading &&
                      video.status !== "complete" && (
                        <button
                          type="button"
                          onClick={() =>
                            removeVideo(video.id)
                          }
                          className="text-xs font-semibold text-zinc-500 hover:text-white"
                        >
                          Remove
                        </button>
                      )}
                  </div>

                  {videos.length > 1 &&
                    video.status !== "complete" && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <select
                          value={video.half}
                          disabled={isUploading}
                          onChange={(event) =>
                            changeHalf(
                              video.id,
                              event.target
                                .value as Half
                            )
                          }
                          className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-xs font-semibold disabled:opacity-50"
                        >
                          <option>
                            First Half
                          </option>
                          <option>
                            Second Half
                          </option>
                        </select>

                        <button
                          type="button"
                          onClick={() =>
                            moveVideo(index, -1)
                          }
                          disabled={
                            index === 0 ||
                            isUploading
                          }
                          className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold disabled:opacity-30"
                        >
                          Move Up
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            moveVideo(index, 1)
                          }
                          disabled={
                            index ===
                              videos.length - 1 ||
                            isUploading
                          }
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
              Your original match footage will be stored
              in InsightFC&apos;s private match-video
              storage. Multiple recordings will ultimately
              be treated as one continuous match.
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
                InsightFC will save the match result,
                securely upload the match videos, then
                prepare the footage for player
                identification, actions, stats, timestamps,
                and clips.
              </p>

              {isUploading && (
                <div className="mt-4 max-w-xl">
                  <div className="mb-2 flex justify-between text-xs font-semibold">
                    <span className="text-yellow-400">
                      Uploading match footage
                    </span>

                    <span className="text-zinc-500">
                      {currentUpload} /{" "}
                      {videos.length}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full bg-yellow-400 transition-all duration-300"
                      style={{
                        width: `${
                          videos.length
                            ? (currentUpload /
                                videos.length) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>

                  <p className="mt-2 text-xs text-zinc-500">
                    Keep this page open while your videos
                    upload.
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={isUploading}
              onClick={processMatch}
              className="shrink-0 rounded-xl bg-yellow-400 px-7 py-3.5 text-sm font-black text-black hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUploading
                ? "Uploading Match…"
                : "Process Match →"}
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
