"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

type TagType =
  | "pass+"
  | "pass-"
  | "takeon+"
  | "takeon-"
  | "shot"
  | "chance"
  | "ballwin"
  | "turnover"
  | "missedtackle";

const TAG_BUTTONS: Array<{
  type: TagType;
  label: string;
  keyHint: string;
  description: string;
}> = [
  {
    type: "pass+",
    label: "Pass +",
    keyHint: "P",
    description: "Completed pass",
  },
  {
    type: "pass-",
    label: "Pass -",
    keyHint: "Shift+P",
    description: "Incomplete pass",
  },
  {
    type: "takeon+",
    label: "Take-on +",
    keyHint: "T",
    description: "Beat defender",
  },
  {
    type: "takeon-",
    label: "Take-on -",
    keyHint: "Shift+T",
    description: "Lost ball on dribble",
  },
  {
    type: "shot",
    label: "Shot",
    keyHint: "S",
    description: "Any shot",
  },
  {
    type: "chance",
    label: "Chance",
    keyHint: "C",
    description: "Big chance created",
  },
  {
    type: "ballwin",
    label: "Ball Win",
    keyHint: "W",
    description: "Won possession",
  },
  {
    type: "turnover",
    label: "Turnover",
    keyHint: "O",
    description: "Lost possession",
  },
  {
    type: "missedtackle",
    label: "Missed Tackle",
    keyHint: "M",
    description: "Tackle attempt missed",
  },
];

const AREA_OPTIONS = ["Left", "Middle", "Right"] as const;
type Area = (typeof AREA_OPTIONS)[number];

type GameRow = {
  id: string;
  team_id: string;
  status: "scheduled" | "in_progress" | "completed";
  type: "game" | "scrimmage" | "tournament";
  date: string;
  time: string | null;
  opponent: string | null;
  location: string | null;
  home_away: "home" | "away" | null;
};

type PlayerRow = {
  id: string;
  team_id: string;
  name: string;
  jersey_number: number | null;
  position: string | null;
};

type TagRow = {
  id: string;
  game_id: string;
  player_id: string | null;
  minute: number | null;
  second: number | null;
  label: string;
  notes: string | null;
  created_at: string;
};

type VideoFile = {
  name: string;
  path: string;
  signedUrl: string;
};

function isTypingTarget(el: EventTarget | null) {
  if (!el) return false;

  const target = el as HTMLElement;
  const tag = (target.tagName || "").toLowerCase();

  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    (target as any).isContentEditable
  );
}

function pad2(n: number) {
  const value = Math.max(
    0,
    Math.min(99, Math.floor(Number.isFinite(n) ? n : 0))
  );

  return String(value).padStart(2, "0");
}

function formatVideoTime(totalSeconds: number) {
  const safeSeconds = Number.isFinite(totalSeconds)
    ? Math.max(0, Math.floor(totalSeconds))
    : 0;

  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;
}

export default function GameTagPage() {
  const params = useParams<{ gameId: string }>();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const gameId = useMemo(() => {
    const raw = params?.gameId;

    if (Array.isArray(raw)) {
      return raw[0] ?? "";
    }

    return raw ?? "";
  }, [params]);

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [game, setGame] = useState<GameRow | null>(null);
  const [roster, setRoster] = useState<PlayerRow[]>([]);
  const [tags, setTags] = useState<TagRow[]>([]);

  const [selectedPlayerId, setSelectedPlayerId] =
    useState<string>("");

  const [minute, setMinute] = useState<number>(0);
  const [second, setSecond] = useState<number>(0);
  const [area, setArea] = useState<Area>("Middle");
  const [notes, setNotes] = useState<string>("");

  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [selectedVideoIndex, setSelectedVideoIndex] =
    useState<number>(0);

  const [videoLoading, setVideoLoading] =
    useState<boolean>(true);

  const [videoError, setVideoError] =
    useState<string | null>(null);

  const [currentVideoSeconds, setCurrentVideoSeconds] =
    useState<number>(0);

  const selectedVideo =
    videos.length > 0
      ? videos[
          Math.min(selectedVideoIndex, videos.length - 1)
        ]
      : null;

  async function loadAll() {
    if (!gameId) return;

    setLoading(true);
    setError(null);

    try {
      // 1) Load game
      const gameRes = await fetch(`/api/games/${gameId}`, {
        cache: "no-store",
      });

      const gameJson = await gameRes.json();

      if (!gameRes.ok || !gameJson.ok) {
        throw new Error(
          gameJson?.error || "Failed to load game"
        );
      }

      const loadedGame: GameRow = gameJson.data;

      if (!loadedGame?.team_id) {
        throw new Error(
          "This game does not have a team assigned."
        );
      }

      setGame(loadedGame);

      // 2) Load roster
      const playersRes = await fetch(
        `/api/players?teamId=${encodeURIComponent(
          loadedGame.team_id
        )}`,
        {
          cache: "no-store",
        }
      );

      const playersJson = await playersRes.json();

      if (!playersRes.ok || !playersJson.ok) {
        throw new Error(
          playersJson?.error || "Failed to load players"
        );
      }

      setRoster(playersJson.data || []);

      // 3) Load tags
      const tagsRes = await fetch(
        `/api/games/${gameId}/tags`,
        {
          cache: "no-store",
        }
      );

      const tagsJson = await tagsRes.json();

      if (!tagsRes.ok || !tagsJson.ok) {
        throw new Error(
          tagsJson?.error || "Failed to load tags"
        );
      }

      setTags(tagsJson.data || []);
    } catch (e: any) {
      setGame(null);
      setRoster([]);
      setTags([]);
      setError(e?.message || "Failed to load tagging");
    } finally {
      setLoading(false);
    }
  }

  async function loadVideos() {
    if (!gameId) return;

    setVideoLoading(true);
    setVideoError(null);

    try {
      const supabase = supabaseBrowser();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!user) {
        throw new Error(
          "You must be signed in to load match video."
        );
      }

      const folderPath = `${user.id}/${gameId}`;

      const { data: files, error: listError } =
        await supabase.storage
          .from("match-videos")
          .list(folderPath, {
            limit: 100,
            offset: 0,
            sortBy: {
              column: "name",
              order: "asc",
            },
          });

      if (listError) {
        throw new Error(listError.message);
      }

      const actualFiles = (files || []).filter(
        (file) =>
          file.name &&
          file.name !== ".emptyFolderPlaceholder"
      );

      if (actualFiles.length === 0) {
        setVideos([]);
        setSelectedVideoIndex(0);
        setCurrentVideoSeconds(0);
        setVideoError(
          "No uploaded video was found for this match."
        );
        return;
      }

      const loadedVideos: VideoFile[] = [];

      for (const file of actualFiles) {
        const path = `${folderPath}/${file.name}`;

        const { data, error: signedError } =
          await supabase.storage
            .from("match-videos")
            .createSignedUrl(path, 60 * 60 * 6);

        if (signedError || !data?.signedUrl) {
          console.error(
            `Could not create signed URL for ${path}:`,
            signedError
          );
          continue;
        }

        loadedVideos.push({
          name: file.name,
          path,
          signedUrl: data.signedUrl,
        });
      }

      if (loadedVideos.length === 0) {
        setVideos([]);
        setSelectedVideoIndex(0);
        setCurrentVideoSeconds(0);
        setVideoError(
          "The match video exists, but InsightFC could not create a playback link."
        );
        return;
      }

      setVideos(loadedVideos);
      setSelectedVideoIndex(0);
      setCurrentVideoSeconds(0);
    } catch (e: any) {
      setVideos([]);
      setSelectedVideoIndex(0);
      setCurrentVideoSeconds(0);
      setVideoError(
        e?.message || "Failed to load match video."
      );
    } finally {
      setVideoLoading(false);
    }
  }

  function syncTagTimeToVideo() {
    const video = videoRef.current;

    if (!video) return;

    const totalSeconds = Math.max(
      0,
      Math.floor(video.currentTime || 0)
    );

    const nextMinute = Math.floor(totalSeconds / 60);
    const nextSecond = totalSeconds % 60;

    setCurrentVideoSeconds(totalSeconds);
    setMinute(nextMinute);
    setSecond(nextSecond);
  }

  async function createTag(tagType: TagType) {
    if (!game) return;

    let tagMinute = minute;
    let tagSecond = second;

    // If a video is loaded, use the exact current video time.
    if (videoRef.current && selectedVideo) {
      const totalSeconds = Math.max(
        0,
        Math.floor(videoRef.current.currentTime || 0)
      );

      tagMinute = Math.floor(totalSeconds / 60);
      tagSecond = totalSeconds % 60;

      setCurrentVideoSeconds(totalSeconds);
      setMinute(tagMinute);
      setSecond(tagSecond);
    }

    const safeMin = Number.isFinite(tagMinute)
      ? Math.max(0, Math.floor(tagMinute))
      : 0;

    const safeSecRaw = Number.isFinite(tagSecond)
      ? Math.floor(tagSecond)
      : 0;

    const safeSec = Math.max(
      0,
      Math.min(59, safeSecRaw)
    );

    const label = `${tagType}:${area}`;

    const res = await fetch(
      `/api/games/${game.id}/tags`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          player_id: selectedPlayerId
            ? selectedPlayerId
            : null,
          minute: safeMin,
          second: safeSec,
          label,
          notes: notes.trim()
            ? notes.trim()
            : null,
        }),
      }
    );

    const json = await res.json();

    if (!res.ok || !json.ok) {
      setError(
        json?.error || "Failed to create tag"
      );
      return;
    }

    setNotes("");

    // Refresh tags/game data without resetting video.
    await loadAll();
  }

  async function deleteTag(tagId: string) {
    const res = await fetch(`/api/tags/${tagId}`, {
      method: "DELETE",
    });

    const json = await res.json();

    if (!res.ok || !json.ok) {
      setError(
        json?.error || "Failed to delete tag"
      );
      return;
    }

    await loadAll();
  }

  async function clearTagsThisGame() {
    if (!game) return;

    const ok = window.confirm(
      "Clear ALL tags for this game?"
    );

    if (!ok) return;

    for (const tag of tags) {
      // eslint-disable-next-line no-await-in-loop
      await fetch(`/api/tags/${tag.id}`, {
        method: "DELETE",
      });
    }

    await loadAll();
  }

  function cycleArea(dir: -1 | 1) {
    const idx = AREA_OPTIONS.indexOf(area);

    const next =
      (idx + dir + AREA_OPTIONS.length) %
      AREA_OPTIONS.length;

    setArea(AREA_OPTIONS[next]);
  }

  function changeVideo(index: number) {
    setSelectedVideoIndex(index);
    setCurrentVideoSeconds(0);
    setMinute(0);
    setSecond(0);
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    loadAll();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, gameId]);

  useEffect(() => {
    if (!mounted) return;

    loadVideos();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, gameId]);

  useEffect(() => {
    if (!mounted) return;

    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;

      if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        cycleArea(-1);
        return;
      }

      if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        cycleArea(1);
        return;
      }

      const isShift = e.shiftKey;

      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        createTag(isShift ? "pass-" : "pass+");
        return;
      }

      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        createTag(
          isShift ? "takeon-" : "takeon+"
        );
        return;
      }

      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        createTag("shot");
        return;
      }

      if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        createTag("chance");
        return;
      }

      if (e.key === "w" || e.key === "W") {
        e.preventDefault();
        createTag("ballwin");
        return;
      }

      if (e.key === "o" || e.key === "O") {
        e.preventDefault();
        createTag("turnover");
        return;
      }

      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        createTag("missedtackle");
      }
    }

    window.addEventListener(
      "keydown",
      onKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        onKeyDown
      );
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mounted,
    game,
    minute,
    second,
    selectedPlayerId,
    area,
    notes,
    selectedVideo,
  ]);

  const playerLabel = useMemo(() => {
    if (!selectedPlayerId) {
      return "Team (no player)";
    }

    const player = roster.find(
      (x) => x.id === selectedPlayerId
    );

    return player
      ? `#${player.jersey_number ?? "--"} — ${
          player.name
        }`
      : "Selected player";
  }, [selectedPlayerId, roster]);

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">
          Game Tagging
        </h1>

        <p className="muted">
          Loading tagging…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-5">
        <h1 className="text-3xl font-bold">
          Can&apos;t open Tagging
        </h1>

        <div className="card border-red-700 text-red-300">
          {error}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="btn-ghost"
            onClick={() => router.back()}
          >
            Go Back
          </button>

          <button
            className="btn-ghost"
            onClick={() => loadAll()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="space-y-4">
        <button
          className="btn-ghost"
          onClick={() => router.back()}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">
          Game Tagging
        </h1>

        <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
          <span className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1">
            <b className="text-zinc-200">P</b>{" "}
            pass+
          </span>

          <span className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1">
            <b className="text-zinc-200">
              Shift+P
            </b>{" "}
            pass-
          </span>

          <span className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1">
            <b className="text-zinc-200">T</b>{" "}
            take-on+
          </span>

          <span className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1">
            <b className="text-zinc-200">
              Shift+T
            </b>{" "}
            take-on-
          </span>

          <span className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1">
            <b className="text-zinc-200">S</b>{" "}
            shot
          </span>

          <span className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1">
            <b className="text-zinc-200">C</b>{" "}
            chance
          </span>

          <span className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1">
            <b className="text-zinc-200">W</b>{" "}
            ball win
          </span>

          <span className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1">
            <b className="text-zinc-200">O</b>{" "}
            turnover
          </span>

          <span className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1">
            <b className="text-zinc-200">M</b>{" "}
            missed tackle
          </span>

          <span className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1">
            <b className="text-zinc-200">
              A/D
            </b>{" "}
            area
          </span>
        </div>
      </div>

      {/* Game Summary */}
      <div className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-sm text-zinc-400">
              Game
            </div>

            <div className="font-semibold">
              {game.date ?? "—"} — vs{" "}
              {game.opponent ?? "(Opponent?)"}{" "}
              <span className="text-zinc-400 font-normal">
                • {tags.length} tags
              </span>
            </div>

            <div className="text-sm text-zinc-400">
              Type: {game.type} • Status:{" "}
              {game.status} • Time:{" "}
              {game.time ?? "—"}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              className="btn-ghost"
              onClick={() => router.back()}
            >
              Back
            </button>

            <button
              className="btn-ghost"
              onClick={async () => {
                await loadAll();
                await loadVideos();
              }}
            >
              Refresh
            </button>

            <button
              className="btn-danger"
              onClick={clearTagsThisGame}
            >
              Clear tags (this game)
            </button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Match Video */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold">
                Match Video
              </div>

              <div className="text-xs text-zinc-500 mt-1">
                Tag time follows the video automatically.
              </div>
            </div>

            {selectedVideo ? (
              <div className="text-sm font-mono text-yellow-300">
                {formatVideoTime(
                  currentVideoSeconds
                )}
              </div>
            ) : null}
          </div>

          {videoLoading ? (
            <div className="min-h-[240px] flex items-center justify-center text-sm text-zinc-400 border border-zinc-800 rounded-xl bg-black">
              Loading match video…
            </div>
          ) : videoError ? (
            <div className="min-h-[240px] flex flex-col items-center justify-center text-center gap-3 text-sm text-zinc-400 border border-zinc-800 rounded-xl bg-black p-5">
              <div>{videoError}</div>

              <button
                className="btn-ghost"
                onClick={() => loadVideos()}
              >
                Retry Video
              </button>
            </div>
          ) : selectedVideo ? (
            <>
              <video
                key={selectedVideo.signedUrl}
                ref={videoRef}
                className="w-full rounded-xl bg-black border border-zinc-800"
                src={selectedVideo.signedUrl}
                controls
                preload="metadata"
                playsInline
                onLoadedMetadata={
                  syncTagTimeToVideo
                }
                onTimeUpdate={
                  syncTagTimeToVideo
                }
                onSeeked={
                  syncTagTimeToVideo
                }
              >
                Your browser does not support video playback.
              </video>

              {videos.length > 1 ? (
                <div className="space-y-2">
                  <div className="text-xs text-zinc-400">
                    Video part
                  </div>

                  <select
                    className="select w-full"
                    value={selectedVideoIndex}
                    onChange={(e) =>
                      changeVideo(
                        Number(e.target.value)
                      )
                    }
                  >
                    {videos.map(
                      (video, index) => (
                        <option
                          key={video.path}
                          value={index}
                        >
                          Part {index + 1} —{" "}
                          {video.name}
                        </option>
                      )
                    )}
                  </select>
                </div>
              ) : null}

              <div className="text-xs text-zinc-500 break-all">
                {selectedVideo.name}
              </div>
            </>
          ) : (
            <div className="min-h-[240px] flex items-center justify-center text-sm text-zinc-400 border border-zinc-800 rounded-xl bg-black">
              No match video found.
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="lg:col-span-2 card space-y-5">
          {/* Player + Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-xs text-zinc-400">
                Player
              </div>

              <select
                className="select w-full"
                value={selectedPlayerId}
                onChange={(e) =>
                  setSelectedPlayerId(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Team (no player)
                </option>

                {roster.map((player) => (
                  <option
                    key={player.id}
                    value={player.id}
                  >
                    #
                    {player.jersey_number ??
                      "--"}{" "}
                    — {player.name}
                  </option>
                ))}
              </select>

              <div className="text-xs text-zinc-400">
                Selected:{" "}
                <span className="text-zinc-200 font-semibold">
                  {playerLabel}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-zinc-400">
                Area of the pitch
              </div>

              <div className="flex gap-2">
                <select
                  className="select flex-1"
                  value={area}
                  onChange={(e) =>
                    setArea(
                      e.target.value as Area
                    )
                  }
                >
                  {AREA_OPTIONS.map(
                    (option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {option}
                      </option>
                    )
                  )}
                </select>

                <button
                  className="btn-ghost"
                  onClick={() =>
                    cycleArea(-1)
                  }
                >
                  A
                </button>

                <button
                  className="btn-ghost"
                  onClick={() =>
                    cycleArea(1)
                  }
                >
                  D
                </button>
              </div>

              <div className="text-xs text-zinc-500">
                Stored on tag label for now.
              </div>
            </div>
          </div>

          {/* Time + Notes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="text-xs text-zinc-400">
                Minute
              </div>

              <input
                className="input w-full"
                type="number"
                value={minute}
                onChange={(e) =>
                  setMinute(
                    parseInt(
                      e.target.value || "0",
                      10
                    )
                  )
                }
                min={0}
              />
            </div>

            <div className="space-y-2">
              <div className="text-xs text-zinc-400">
                Second
              </div>

              <input
                className="input w-full"
                type="number"
                value={second}
                onChange={(e) =>
                  setSecond(
                    parseInt(
                      e.target.value || "0",
                      10
                    )
                  )
                }
                min={0}
                max={59}
              />
            </div>

            <div className="space-y-2">
              <div className="text-xs text-zinc-400">
                Notes (optional)
              </div>

              <input
                className="input w-full"
                value={notes}
                onChange={(e) =>
                  setNotes(e.target.value)
                }
                placeholder="quick note…"
              />
            </div>
          </div>

          {selectedVideo ? (
            <div className="text-xs text-zinc-500">
              Video timestamp is active. New
              tags will use the video&apos;s
              current time automatically.
            </div>
          ) : (
            <div className="text-xs text-zinc-500">
              No video is active, so you can
              enter the minute and second
              manually.
            </div>
          )}

          {/* Tag buttons */}
          <div className="space-y-3">
            <div className="text-sm font-semibold">
              Tag buttons
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {TAG_BUTTONS.map(
                (button) => (
                  <button
                    key={button.type}
                    className="border border-zinc-700 rounded-xl p-4 hover:border-yellow-400 transition text-left"
                    onClick={() =>
                      createTag(button.type)
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold">
                        {button.label}
                      </div>

                      <div className="text-xs text-zinc-500">
                        {button.keyHint}
                      </div>
                    </div>

                    <div className="text-xs text-zinc-400 mt-1">
                      {button.description}
                    </div>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Tag list */}
          <div className="pt-4 border-t border-zinc-800 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold">
                Tags ({tags.length})
              </div>

              <div className="text-xs text-zinc-500">
                Current: {pad2(minute)}:
                {pad2(second)}
              </div>
            </div>

            {tags.length === 0 ? (
              <p className="muted">
                No tags yet. Play the video,
                select a player, then click a
                tag button or use a keyboard
                shortcut.
              </p>
            ) : (
              <div className="space-y-2 max-h-[320px] overflow-auto pr-2">
                {tags
                  .slice()
                  .sort((a, b) =>
                    b.created_at >
                    a.created_at
                      ? 1
                      : -1
                  )
                  .map((tag) => {
                    const [
                      baseType,
                      packedArea,
                    ] = (
                      tag.label || ""
                    ).split(":");

                    const player =
                      tag.player_id
                        ? roster.find(
                            (item) =>
                              item.id ===
                              tag.player_id
                          )
                        : null;

                    return (
                      <div
                        key={tag.id}
                        className="bg-black border border-zinc-800 rounded-xl p-4 space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="text-sm font-semibold">
                            {pad2(
                              tag.minute ?? 0
                            )}
                            :
                            {pad2(
                              tag.second ?? 0
                            )}{" "}
                            •{" "}
                            {baseType ||
                              tag.label}
                            {packedArea
                              ? ` • ${packedArea}`
                              : ""}
                          </div>

                          <button
                            className="btn-danger"
                            onClick={() =>
                              deleteTag(tag.id)
                            }
                          >
                            Delete
                          </button>
                        </div>

                        <div className="text-xs text-zinc-400">
                          Player:{" "}
                          <span className="text-zinc-200 font-semibold">
                            {player
                              ? `#${
                                  player.jersey_number ??
                                  "--"
                                } — ${
                                  player.name
                                }`
                              : tag.player_id
                              ? "(missing player)"
                              : "Team"}
                          </span>

                          {tag.notes ? (
                            <>
                              {" "}
                              • Notes:{" "}
                              {tag.notes}
                            </>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="text-xs text-zinc-500">
        Manual tagging mode • Tags use the
        active video timestamp when a match
        video is loaded.
      </div>
    </div>
  );
}
