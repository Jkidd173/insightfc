"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

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

type VideoFile = {
  name: string;
  path: string;
  signedUrl: string;
};

type ClipRow = {
  id: string;
  game_id: string;
  player_id: string | null;
  created_by: string;
  video_path: string;
  start_seconds: number | string;
  end_seconds: number | string;
  action: string | null;
  area: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function formatTime(seconds: number) {
  const safe = Number.isFinite(seconds)
    ? Math.max(0, seconds)
    : 0;

  const minutes = Math.floor(safe / 60);
  const secs = safe - minutes * 60;

  return `${String(minutes).padStart(2, "0")}:${secs
    .toFixed(1)
    .padStart(4, "0")}`;
}

function clipNumber(value: number | string) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function isTypingTarget(target: EventTarget | null) {
  if (!target) return false;

  const element = target as HTMLElement;
  const tag = element.tagName?.toLowerCase();

  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    tag === "button" ||
    element.isContentEditable
  );
}

export default function GameTagPage() {
  const params = useParams<{ gameId: string }>();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const gameId = useMemo(() => {
    const raw = params?.gameId;
    return Array.isArray(raw) ? raw[0] ?? "" : raw ?? "";
  }, [params]);

  const [mounted, setMounted] = useState(false);

  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState<GameRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState("");

  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [selectedVideoIndex, setSelectedVideoIndex] =
    useState(0);

  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(
    null
  );

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [clips, setClips] = useState<ClipRow[]>([]);
  const [clipsLoading, setClipsLoading] = useState(true);

  const [draftStart, setDraftStart] = useState<number | null>(
    null
  );
  const [draftEnd, setDraftEnd] = useState<number | null>(
    null
  );

  const [editingClipId, setEditingClipId] = useState<
    string | null
  >(null);

  const [saving, setSaving] = useState(false);

  const [loopClipId, setLoopClipId] = useState<string | null>(
    null
  );

  const selectedVideo =
    videos.length > 0
      ? videos[
          Math.min(selectedVideoIndex, videos.length - 1)
        ]
      : null;

  async function loadGame() {
    if (!gameId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/games/${gameId}`, {
        cache: "no-store",
      });

      const json = await response.json();

      if (!response.ok || !json.ok) {
        throw new Error(json?.error || "Failed to load game.");
      }

      setGame(json.data);
    } catch (e: any) {
      setGame(null);
      setError(e?.message || "Failed to load game.");
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
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw new Error(authError.message);
      }

      if (!user) {
        throw new Error(
          "You must be signed in to load match video."
        );
      }

      setUserId(user.id);

      const folder = `${user.id}/${gameId}`;

      const { data: files, error: listError } =
        await supabase.storage
          .from("match-videos")
          .list(folder, {
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

      const actualFiles = (files ?? []).filter(
        (file) =>
          file.name &&
          file.name !== ".emptyFolderPlaceholder"
      );

      const loadedVideos: VideoFile[] = [];

      for (const file of actualFiles) {
        const path = `${folder}/${file.name}`;

        const { data, error: signedError } =
          await supabase.storage
            .from("match-videos")
            .createSignedUrl(path, 60 * 60 * 6);

        if (signedError || !data?.signedUrl) {
          console.error(
            "Failed to create video URL:",
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
        setVideoError(
          "No uploaded video was found for this match."
        );
        return;
      }

      setVideos(loadedVideos);
      setSelectedVideoIndex(0);
    } catch (e: any) {
      setVideos([]);
      setVideoError(
        e?.message || "Failed to load match video."
      );
    } finally {
      setVideoLoading(false);
    }
  }

  async function loadClips() {
    if (!gameId) return;

    setClipsLoading(true);

    try {
      const supabase = supabaseBrowser();

      const { data, error: clipsError } = await supabase
        .from("clips")
        .select("*")
        .eq("game_id", gameId)
        .order("start_seconds", { ascending: true });

      if (clipsError) {
        throw new Error(clipsError.message);
      }

      setClips((data ?? []) as ClipRow[]);
    } catch (e: any) {
      setError(e?.message || "Failed to load clips.");
    } finally {
      setClipsLoading(false);
    }
  }

  function stopLoop() {
    setLoopClipId(null);
  }

  function cancelDraft() {
    setDraftStart(null);
    setDraftEnd(null);
    setEditingClipId(null);
  }

  function syncVideoTime() {
    const video = videoRef.current;
    if (!video) return;

    setCurrentTime(video.currentTime || 0);
    setDuration(video.duration || 0);

    if (loopClipId) {
      const clip = clips.find(
        (item) => item.id === loopClipId
      );

      if (clip) {
        const start = clipNumber(clip.start_seconds);
        const end = clipNumber(clip.end_seconds);

        if (video.currentTime >= end) {
          video.currentTime = start;
          video.play().catch(() => {});
        }
      }
    }
  }

  function createDefaultDraft() {
    if (!selectedVideo || !videoRef.current) return;

    stopLoop();

    const video = videoRef.current;
    const center = video.currentTime || 0;

    const videoDuration =
      Number.isFinite(video.duration) && video.duration > 0
        ? video.duration
        : duration;

    const start = Math.max(0, center - 4);

    const end =
      videoDuration > 0
        ? Math.min(videoDuration, center + 4)
        : center + 4;

    setEditingClipId(null);
    setDraftStart(Number(start.toFixed(1)));
    setDraftEnd(Number(end.toFixed(1)));
  }

  function toggleVideoPlayback() {
    const video = videoRef.current;

    if (!video || !selectedVideo) return;

    if (video.paused || video.ended) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }

  async function saveDraft() {
    if (
      !selectedVideo ||
      draftStart === null ||
      draftEnd === null
    ) {
      return;
    }

    if (!userId) {
      setError("You must be signed in to save clips.");
      return;
    }

    const start = Math.max(0, Number(draftStart));
    const end = Math.max(0, Number(draftEnd));

    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      setError("Clip start and end must be valid numbers.");
      return;
    }

    if (end <= start) {
      setError("Clip end must be after clip start.");
      return;
    }

    if (duration > 0 && end > duration + 0.1) {
      setError("Clip end cannot be after the video ends.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const supabase = supabaseBrowser();

      if (editingClipId) {
        const { error: updateError } = await supabase
          .from("clips")
          .update({
            start_seconds: Number(start.toFixed(3)),
            end_seconds: Number(end.toFixed(3)),
            video_path: selectedVideo.path,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingClipId);

        if (updateError) {
          throw new Error(updateError.message);
        }
      } else {
        const { error: insertError } = await supabase
          .from("clips")
          .insert({
            game_id: gameId,
            player_id: null,
            created_by: userId,
            video_path: selectedVideo.path,
            start_seconds: Number(start.toFixed(3)),
            end_seconds: Number(end.toFixed(3)),
            action: null,
            area: null,
            notes: null,
          });

        if (insertError) {
          throw new Error(insertError.message);
        }
      }

      cancelDraft();
      await loadClips();
    } catch (e: any) {
      setError(e?.message || "Failed to save clip.");
    } finally {
      setSaving(false);
    }
  }

  function editClip(clip: ClipRow) {
    stopLoop();

    const videoIndex = videos.findIndex(
      (video) => video.path === clip.video_path
    );

    if (videoIndex >= 0) {
      setSelectedVideoIndex(videoIndex);
    }

    setEditingClipId(clip.id);
    setDraftStart(clipNumber(clip.start_seconds));
    setDraftEnd(clipNumber(clip.end_seconds));
  }

  async function deleteClip(clip: ClipRow) {
    const confirmed = window.confirm(
      `Delete this ${(
        clipNumber(clip.end_seconds) -
        clipNumber(clip.start_seconds)
      ).toFixed(1)} second clip?`
    );

    if (!confirmed) return;

    try {
      const supabase = supabaseBrowser();

      const { error: deleteError } = await supabase
        .from("clips")
        .delete()
        .eq("id", clip.id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      if (loopClipId === clip.id) {
        stopLoop();
      }

      if (editingClipId === clip.id) {
        cancelDraft();
      }

      await loadClips();
    } catch (e: any) {
      setError(e?.message || "Failed to delete clip.");
    }
  }

  function watchClip(clip: ClipRow) {
    const videoIndex = videos.findIndex(
      (video) => video.path === clip.video_path
    );

    if (videoIndex < 0) {
      setError("The video for this clip could not be found.");
      return;
    }

    setError(null);
    setSelectedVideoIndex(videoIndex);
    setLoopClipId(clip.id);
    cancelDraft();

    window.setTimeout(() => {
      const video = videoRef.current;
      if (!video) return;

      video.currentTime = clipNumber(clip.start_seconds);
      video.play().catch(() => {});
    }, 100);
  }

  function jumpTo(seconds: number) {
    const video = videoRef.current;
    if (!video) return;

    stopLoop();

    const safe = Math.max(
      0,
      Math.min(
        duration > 0 ? duration : seconds,
        seconds
      )
    );

    video.currentTime = safe;
    setCurrentTime(safe);
  }

  function changeVideo(index: number) {
    stopLoop();
    cancelDraft();

    setSelectedVideoIndex(index);
    setCurrentTime(0);
    setDuration(0);
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !gameId) return;

    loadGame();
    loadVideos();
    loadClips();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, gameId]);

  /*
    KEYBOARD WORKFLOW

    SPACE:
    Create an 8-second clip draft centered on the playhead.

    LEFT SHIFT / RIGHT SHIFT:
    Play or pause the active match video.

    Shortcuts are ignored while typing or editing controls.
  */
  useEffect(() => {
    if (!mounted) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return;

      if (event.code === "Space") {
        event.preventDefault();

        if (event.repeat) return;

        createDefaultDraft();
        return;
      }

      if (
        event.code === "ShiftLeft" ||
        event.code === "ShiftRight"
      ) {
        event.preventDefault();

        if (event.repeat) return;

        toggleVideoPlayback();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mounted,
    selectedVideo,
    duration,
    currentTime,
    loopClipId,
  ]);

  useEffect(() => {
    if (!loopClipId) return;

    const clip = clips.find(
      (item) => item.id === loopClipId
    );

    if (!clip || !selectedVideo) return;

    if (clip.video_path !== selectedVideo.path) return;

    const timer = window.setTimeout(() => {
      const video = videoRef.current;
      if (!video) return;

      video.currentTime = clipNumber(clip.start_seconds);
      video.play().catch(() => {});
    }, 150);

    return () => window.clearTimeout(timer);
  }, [selectedVideoIndex, loopClipId, clips, selectedVideo]);

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">
          Clip Events
        </h1>

        <p className="muted">
          Loading match…
        </p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="space-y-5">
        <h1 className="text-3xl font-bold">
          Can&apos;t open match
        </h1>

        {error ? (
          <div className="card border-red-700 text-red-300">
            {error}
          </div>
        ) : null}

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
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-yellow-400 font-semibold">
            Step 1 of 2
          </div>

          <h1 className="text-3xl font-bold mt-1">
            Clip Events
          </h1>

          <p className="text-sm text-zinc-400 mt-2">
            Find the moments that matter. Tag the clips afterward.
          </p>

          <div className="flex flex-wrap gap-2 mt-3 text-xs">
            <span className="border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-300">
              <b className="text-white">Space</b> — Create 8s Clip
            </span>

            <span className="border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-300">
              <b className="text-white">Shift</b> — Play / Pause
            </span>
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
              await loadVideos();
              await loadClips();
            }}
          >
            Refresh
          </button>

          <button
            className="btn-primary"
            disabled={clips.length === 0}
            onClick={() =>
              window.alert(
                "Step 2: Tag Clips is next. Your clips are safely saved."
              )
            }
          >
            Tag Clips ({clips.length})
          </button>
        </div>
      </div>

      {/* GAME */}
      <div className="card">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <div className="text-xs text-zinc-500">
              MATCH
            </div>

            <div className="font-semibold mt-1">
              {game.date} — vs{" "}
              {game.opponent ?? "(Opponent?)"}
            </div>
          </div>

          <div className="text-sm text-zinc-400">
            {game.type} • {game.status}
          </div>
        </div>
      </div>

      {error ? (
        <div className="card border-red-700 text-red-300">
          {error}
        </div>
      ) : null}

      {/* LARGE VIDEO */}
      <div className="space-y-4">
        <div className="card p-3 md:p-4">
          {videoLoading ? (
            <div className="w-full aspect-video bg-black rounded-xl flex items-center justify-center text-zinc-400">
              Loading match video…
            </div>
          ) : videoError ? (
            <div className="w-full aspect-video bg-black rounded-xl flex flex-col items-center justify-center gap-4 text-center text-zinc-400 p-8">
              <div>{videoError}</div>

              <button
                className="btn-ghost"
                onClick={loadVideos}
              >
                Retry Video
              </button>
            </div>
          ) : selectedVideo ? (
            <video
              key={selectedVideo.signedUrl}
              ref={videoRef}
              src={selectedVideo.signedUrl}
              controls
              playsInline
              preload="metadata"
              className="w-full max-h-[72vh] bg-black rounded-xl"
              onLoadedMetadata={(event) => {
                setDuration(
                  event.currentTarget.duration || 0
                );

                setCurrentTime(
                  event.currentTarget.currentTime || 0
                );
              }}
              onTimeUpdate={syncVideoTime}
              onSeeked={syncVideoTime}
            >
              Your browser does not support video playback.
            </video>
          ) : (
            <div className="w-full aspect-video bg-black rounded-xl flex items-center justify-center text-zinc-400">
              No video found.
            </div>
          )}
        </div>

        {/* VIDEO TOOLBAR */}
        {selectedVideo ? (
          <div className="card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs text-zinc-500">
                  PLAYHEAD
                </div>

                <div className="text-2xl font-mono font-bold text-yellow-300">
                  {formatTime(currentTime)}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  className="btn-ghost"
                  onClick={() =>
                    jumpTo(currentTime - 5)
                  }
                >
                  −5 sec
                </button>

                <button
                  className="btn-ghost"
                  onClick={() =>
                    jumpTo(currentTime - 1)
                  }
                >
                  −1 sec
                </button>

                <button
                  className="btn-ghost"
                  onClick={() =>
                    jumpTo(currentTime + 1)
                  }
                >
                  +1 sec
                </button>

                <button
                  className="btn-ghost"
                  onClick={() =>
                    jumpTo(currentTime + 5)
                  }
                >
                  +5 sec
                </button>

                <button
                  className="btn-primary"
                  onClick={createDefaultDraft}
                >
                  Create 8s Clip
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
              <span>
                Spacebar creates a clip at the playhead.
              </span>

              <span>•</span>

              <span>
                Either Shift key plays or pauses.
              </span>
            </div>

            {videos.length > 1 ? (
              <div>
                <div className="text-xs text-zinc-500 mb-2">
                  VIDEO PART
                </div>

                <select
                  className="select w-full"
                  value={selectedVideoIndex}
                  onChange={(event) =>
                    changeVideo(
                      Number(event.target.value)
                    )
                  }
                >
                  {videos.map((video, index) => (
                    <option
                      key={video.path}
                      value={index}
                    >
                      Part {index + 1} — {video.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* CLIP EDITOR */}
      {draftStart !== null && draftEnd !== null ? (
        <div className="card border-yellow-500/50 space-y-5">
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.15em] text-yellow-400">
                {editingClipId
                  ? "Editing Clip"
                  : "New Clip"}
              </div>

              <div className="font-semibold mt-1">
                Adjust the exact event window
              </div>
            </div>

            <div className="text-sm text-zinc-400">
              Length:{" "}
              <span className="text-white font-semibold">
                {Math.max(
                  0,
                  draftEnd - draftStart
                ).toFixed(1)}
                s
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-xs text-zinc-400">
                Clip starts at
              </span>

              <input
                className="input w-full"
                type="number"
                min={0}
                step={0.1}
                value={draftStart}
                onChange={(event) =>
                  setDraftStart(
                    Number(event.target.value)
                  )
                }
              />

              <span className="text-xs text-zinc-500">
                {formatTime(draftStart)}
              </span>
            </label>

            <label className="space-y-2">
              <span className="text-xs text-zinc-400">
                Clip ends at
              </span>

              <input
                className="input w-full"
                type="number"
                min={0}
                step={0.1}
                value={draftEnd}
                onChange={(event) =>
                  setDraftEnd(
                    Number(event.target.value)
                  )
                }
              />

              <span className="text-xs text-zinc-500">
                {formatTime(draftEnd)}
              </span>
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="btn-ghost"
              onClick={() => {
                if (!videoRef.current) return;

                videoRef.current.currentTime =
                  draftStart;

                setCurrentTime(draftStart);

                videoRef.current
                  .play()
                  .catch(() => {});
              }}
            >
              Preview From Start
            </button>

            <button
              className="btn-ghost"
              onClick={() =>
                setDraftStart(
                  Number(
                    Math.max(
                      0,
                      draftStart - 0.5
                    ).toFixed(1)
                  )
                )
              }
            >
              Start −0.5s
            </button>

            <button
              className="btn-ghost"
              onClick={() =>
                setDraftStart(
                  Number(
                    (draftStart + 0.5).toFixed(1)
                  )
                )
              }
            >
              Start +0.5s
            </button>

            <button
              className="btn-ghost"
              onClick={() =>
                setDraftEnd(
                  Number(
                    Math.max(
                      0,
                      draftEnd - 0.5
                    ).toFixed(1)
                  )
                )
              }
            >
              End −0.5s
            </button>

            <button
              className="btn-ghost"
              onClick={() =>
                setDraftEnd(
                  Number(
                    (draftEnd + 0.5).toFixed(1)
                  )
                )
              }
            >
              End +0.5s
            </button>
          </div>

          <div className="text-xs text-zinc-500">
            Default clips are 4 seconds before + 4 seconds
            after the playhead. Shorten them, lengthen them,
            or overlap them as much as you need.
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              className="btn-primary"
              disabled={saving}
              onClick={saveDraft}
            >
              {saving
                ? "Saving…"
                : editingClipId
                ? "Save Changes"
                : "Save Clip"}
            </button>

            <button
              className="btn-ghost"
              disabled={saving}
              onClick={cancelDraft}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {/* CLIP QUEUE */}
      <div className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">
              Event Clips
            </h2>

            <p className="text-sm text-zinc-400 mt-1">
              Clips may overlap. One clip can contain multiple
              player events and multiple tags.
            </p>
          </div>

          <div className="text-sm text-zinc-400">
            {clips.length} total
          </div>
        </div>

        {clipsLoading ? (
          <p className="muted">
            Loading clips…
          </p>
        ) : clips.length === 0 ? (
          <div className="border border-dashed border-zinc-700 rounded-xl p-8 text-center">
            <div className="font-semibold">
              No event clips yet
            </div>

            <div className="text-sm text-zinc-400 mt-2">
              Play or scrub the match to an event, then press
              Spacebar or click Create 8s Clip.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {clips.map((clip, index) => {
              const start = clipNumber(
                clip.start_seconds
              );

              const end = clipNumber(
                clip.end_seconds
              );

              const clipVideoIndex =
                videos.findIndex(
                  (video) =>
                    video.path === clip.video_path
                );

              return (
                <div
                  key={clip.id}
                  className={`border rounded-xl p-4 ${
                    loopClipId === clip.id
                      ? "border-yellow-400 bg-yellow-400/5"
                      : "border-zinc-800 bg-black/30"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold">
                        Clip {index + 1}
                      </div>

                      <div className="text-sm text-zinc-300 mt-1">
                        {formatTime(start)} →{" "}
                        {formatTime(end)}
                      </div>

                      <div className="text-xs text-zinc-500 mt-1">
                        {(end - start).toFixed(1)} seconds
                        {clipVideoIndex >= 0
                          ? ` • Video part ${
                              clipVideoIndex + 1
                            }`
                          : ""}
                        {clip.action
                          ? ` • ${clip.action}`
                          : " • Untagged"}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {loopClipId === clip.id ? (
                        <button
                          className="btn-ghost"
                          onClick={stopLoop}
                        >
                          Stop Loop
                        </button>
                      ) : (
                        <button
                          className="btn-ghost"
                          onClick={() =>
                            watchClip(clip)
                          }
                        >
                          Watch
                        </button>
                      )}

                      <button
                        className="btn-ghost"
                        onClick={() =>
                          editClip(clip)
                        }
                      >
                        Edit Length
                      </button>

                      <button
                        className="btn-danger"
                        onClick={() =>
                          deleteClip(clip)
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-xs text-zinc-500 pb-4">
        Step 1: create and refine clips • Step 2: add multiple
        player events and tags to each clip
      </div>
    </div>
  );
}
