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

type PlayerRow = {
  id: string;
  team_id: string;
  name: string;
  jersey_number: number | string | null;
  position: string | null;
  status: string | null;
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

type ClipEventRow = {
  id: string;
  clip_id: string;
  game_id: string;
  player_id: string | null;
  created_by: string;
  action: string;
  event_seconds: number | string;
  area: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type VideoFile = {
  name: string;
  path: string;
  signedUrl: string;
};

const ACTIONS = [
  "Touch",
  "Pass",
  "Carry 10+ yd",
  "Take-on",
  "Shot",
  "Goal",
  "Assist",
  "Possession Won",
  "Pressure",
] as const;

const AREAS = [
  "Defensive Third",
  "Middle Third",
  "Attacking Third",
  "Penalty Area",
  "Wide Left",
  "Wide Right",
  "Central",
];

function numberValue(value: number | string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

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

export default function TagClipsPage() {
  const params = useParams<{ gameId: string }>();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const gameId = useMemo(() => {
    const raw = params?.gameId;

    return Array.isArray(raw)
      ? raw[0] ?? ""
      : raw ?? "";
  }, [params]);

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  const [game, setGame] = useState<GameRow | null>(null);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [clips, setClips] = useState<ClipRow[]>([]);
  const [events, setEvents] = useState<ClipEventRow[]>([]);
  const [videos, setVideos] = useState<VideoFile[]>([]);

  const [userId, setUserId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const [selectedPlayerId, setSelectedPlayerId] =
    useState<string>("team");

  const [selectedAction, setSelectedAction] =
    useState<string>("Touch");

  const [selectedArea, setSelectedArea] =
    useState<string>("");

  const [notes, setNotes] = useState("");

  const [savingEvent, setSavingEvent] = useState(false);

  const [editingEventId, setEditingEventId] =
    useState<string | null>(null);

  const [clipStartDraft, setClipStartDraft] =
    useState<number | null>(null);

  const [clipEndDraft, setClipEndDraft] =
    useState<number | null>(null);

  const [editingClipLength, setEditingClipLength] =
    useState(false);

  const [savingClipLength, setSavingClipLength] =
    useState(false);

  const [notice, setNotice] = useState<string | null>(null);

  const noticeTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const sortedClips = useMemo(() => {
    return [...clips].sort(
      (a, b) =>
        numberValue(a.start_seconds) -
        numberValue(b.start_seconds)
    );
  }, [clips]);

  const currentClip =
    sortedClips.length > 0
      ? sortedClips[
          Math.min(
            currentClipIndex,
            sortedClips.length - 1
          )
        ]
      : null;

  const currentVideo = useMemo(() => {
    if (!currentClip) return null;

    return (
      videos.find(
        (video) =>
          video.path === currentClip.video_path
      ) ?? null
    );
  }, [currentClip, videos]);

  const currentClipEvents = useMemo(() => {
    if (!currentClip) return [];

    return events
      .filter(
        (event) =>
          event.clip_id === currentClip.id
      )
      .sort(
        (a, b) =>
          numberValue(a.event_seconds) -
          numberValue(b.event_seconds)
      );
  }, [events, currentClip]);

  function showNotice(message: string) {
    setNotice(message);

    if (noticeTimerRef.current) {
      clearTimeout(noticeTimerRef.current);
    }

    noticeTimerRef.current = setTimeout(() => {
      setNotice(null);
    }, 1800);
  }

  async function loadWorkspace() {
    if (!gameId) return;

    setLoading(true);
    setError(null);

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
          "You must be signed in to tag clips."
        );
      }

      setUserId(user.id);

      const gameResponse = await fetch(
        `/api/games/${gameId}`,
        {
          cache: "no-store",
        }
      );

      const gameJson = await gameResponse.json();

      if (!gameResponse.ok || !gameJson.ok) {
        throw new Error(
          gameJson?.error || "Failed to load game."
        );
      }

      const loadedGame = gameJson.data as GameRow;
      setGame(loadedGame);

      const [
        playersResult,
        clipsResult,
        eventsResult,
      ] = await Promise.all([
        supabase
          .from("players")
          .select(
            "id,team_id,name,jersey_number,position,status"
          )
          .eq("team_id", loadedGame.team_id)
          .order("jersey_number", {
            ascending: true,
          }),

        supabase
          .from("clips")
          .select("*")
          .eq("game_id", gameId)
          .order("start_seconds", {
            ascending: true,
          }),

        supabase
          .from("clip_events")
          .select("*")
          .eq("game_id", gameId)
          .order("event_seconds", {
            ascending: true,
          }),
      ]);

      if (playersResult.error) {
        throw new Error(playersResult.error.message);
      }

      if (clipsResult.error) {
        throw new Error(clipsResult.error.message);
      }

      if (eventsResult.error) {
        throw new Error(eventsResult.error.message);
      }

      const loadedPlayers =
        (playersResult.data ?? []) as PlayerRow[];

      setPlayers(
        loadedPlayers.filter(
          (player) =>
            !player.status ||
            player.status === "active" ||
            player.status === "guest"
        )
      );

      const loadedClips =
        (clipsResult.data ?? []) as ClipRow[];

      setClips(loadedClips);

      setEvents(
        (eventsResult.data ?? []) as ClipEventRow[]
      );

      const uniquePaths = Array.from(
        new Set(
          loadedClips.map(
            (clip) => clip.video_path
          )
        )
      );

      const loadedVideos: VideoFile[] = [];

      for (const path of uniquePaths) {
        const { data, error: signedError } =
          await supabase.storage
            .from("match-videos")
            .createSignedUrl(
              path,
              60 * 60 * 6
            );

        if (
          signedError ||
          !data?.signedUrl
        ) {
          console.error(
            "Could not load clip video:",
            signedError
          );

          continue;
        }

        const name =
          path.split("/").pop() ?? "Match video";

        loadedVideos.push({
          name,
          path,
          signedUrl: data.signedUrl,
        });
      }

      setVideos(loadedVideos);

      if (loadedClips.length > 0) {
        setCurrentClipIndex(0);
      }
    } catch (e: any) {
      setError(
        e?.message ||
          "Failed to load tagging workspace."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetEventForm() {
    setSelectedPlayerId("team");
    setSelectedAction("Touch");
    setSelectedArea("");
    setNotes("");
    setEditingEventId(null);
  }

  function playCurrentClip() {
    if (!currentClip || !videoRef.current) {
      return;
    }

    const video = videoRef.current;
    const start = numberValue(
      currentClip.start_seconds
    );

    video.currentTime = start;
    setCurrentTime(start);

    video.play().catch(() => {});
  }

  function togglePlayback() {
    const video = videoRef.current;

    if (!video) return;

    if (video.paused || video.ended) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }

  function handleVideoTimeUpdate() {
    const video = videoRef.current;

    if (!video || !currentClip) return;

    const start = numberValue(
      currentClip.start_seconds
    );

    const end = numberValue(
      currentClip.end_seconds
    );

    setCurrentTime(video.currentTime);

    if (video.currentTime >= end) {
      video.currentTime = start;
      setCurrentTime(start);

      video.play().catch(() => {});
    }
  }

  function goToClip(index: number) {
    if (
      index < 0 ||
      index >= sortedClips.length
    ) {
      return;
    }

    setCurrentClipIndex(index);
    resetEventForm();
    setEditingClipLength(false);
  }

  function previousClip() {
    goToClip(
      Math.max(0, currentClipIndex - 1)
    );
  }

  function nextClip() {
    goToClip(
      Math.min(
        sortedClips.length - 1,
        currentClipIndex + 1
      )
    );
  }

  async function saveEvent() {
    if (!currentClip || !userId) return;

    const clipStart = numberValue(
      currentClip.start_seconds
    );

    const clipEnd = numberValue(
      currentClip.end_seconds
    );

    let eventSeconds = currentTime;

    if (
      !Number.isFinite(eventSeconds) ||
      eventSeconds < clipStart ||
      eventSeconds > clipEnd
    ) {
      eventSeconds = clipStart;
    }

    setSavingEvent(true);
    setError(null);

    try {
      const supabase = supabaseBrowser();

      const eventData = {
        clip_id: currentClip.id,
        game_id: gameId,
        player_id:
          selectedPlayerId === "team"
            ? null
            : selectedPlayerId,
        created_by: userId,
        action: selectedAction,
        event_seconds: Number(
          eventSeconds.toFixed(3)
        ),
        area:
          selectedArea || null,
        notes:
          notes.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (editingEventId) {
        const {
          data,
          error: updateError,
        } = await supabase
          .from("clip_events")
          .update(eventData)
          .eq("id", editingEventId)
          .select("*")
          .single();

        if (updateError) {
          throw new Error(
            updateError.message
          );
        }

        setEvents((existing) =>
          existing.map((event) =>
            event.id === editingEventId
              ? (data as ClipEventRow)
              : event
          )
        );

        showNotice("Event updated");
      } else {
        const {
          data,
          error: insertError,
        } = await supabase
          .from("clip_events")
          .insert(eventData)
          .select("*")
          .single();

        if (insertError) {
          throw new Error(
            insertError.message
          );
        }

        setEvents((existing) => [
          ...existing,
          data as ClipEventRow,
        ]);

        showNotice("Event added");
      }

      resetEventForm();
    } catch (e: any) {
      setError(
        e?.message ||
          "Failed to save event."
      );
    } finally {
      setSavingEvent(false);
    }
  }

  function editEvent(event: ClipEventRow) {
    setEditingEventId(event.id);

    setSelectedPlayerId(
      event.player_id ?? "team"
    );

    setSelectedAction(event.action);
    setSelectedArea(event.area ?? "");
    setNotes(event.notes ?? "");

    const video = videoRef.current;

    if (video) {
      const eventTime = numberValue(
        event.event_seconds
      );

      video.currentTime = eventTime;
      setCurrentTime(eventTime);
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function duplicateEvent(event: ClipEventRow) {
    setEditingEventId(null);

    setSelectedPlayerId(
      event.player_id ?? "team"
    );

    setSelectedAction(event.action);
    setSelectedArea(event.area ?? "");
    setNotes(event.notes ?? "");

    const video = videoRef.current;

    if (video) {
      const eventTime = numberValue(
        event.event_seconds
      );

      video.currentTime = eventTime;
      setCurrentTime(eventTime);
    }

    showNotice(
      "Duplicated — change anything you need, then Add Event"
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function deleteEvent(
    event: ClipEventRow
  ) {
    const confirmed = window.confirm(
      `Delete this ${event.action} event?`
    );

    if (!confirmed) return;

    try {
      const supabase = supabaseBrowser();

      const { error: deleteError } =
        await supabase
          .from("clip_events")
          .delete()
          .eq("id", event.id);

      if (deleteError) {
        throw new Error(
          deleteError.message
        );
      }

      setEvents((existing) =>
        existing.filter(
          (item) =>
            item.id !== event.id
        )
      );

      if (
        editingEventId === event.id
      ) {
        resetEventForm();
      }

      showNotice("Event deleted");
    } catch (e: any) {
      setError(
        e?.message ||
          "Failed to delete event."
      );
    }
  }

  function beginClipLengthEdit() {
    if (!currentClip) return;

    setClipStartDraft(
      numberValue(
        currentClip.start_seconds
      )
    );

    setClipEndDraft(
      numberValue(
        currentClip.end_seconds
      )
    );

    setEditingClipLength(true);
  }

  async function saveClipLength() {
    if (
      !currentClip ||
      clipStartDraft === null ||
      clipEndDraft === null
    ) {
      return;
    }

    const start = Number(
      clipStartDraft
    );

    const end = Number(
      clipEndDraft
    );

    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end)
    ) {
      setError(
        "Clip times must be valid numbers."
      );

      return;
    }

    if (start < 0) {
      setError(
        "Clip start cannot be negative."
      );

      return;
    }

    if (end <= start) {
      setError(
        "Clip end must be after clip start."
      );

      return;
    }

    setSavingClipLength(true);
    setError(null);

    try {
      const supabase = supabaseBrowser();

      const {
        data,
        error: updateError,
      } = await supabase
        .from("clips")
        .update({
          start_seconds: Number(
            start.toFixed(3)
          ),
          end_seconds: Number(
            end.toFixed(3)
          ),
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", currentClip.id)
        .select("*")
        .single();

      if (updateError) {
        throw new Error(
          updateError.message
        );
      }

      setClips((existing) =>
        existing.map((clip) =>
          clip.id === currentClip.id
            ? (data as ClipRow)
            : clip
        )
      );

      setEditingClipLength(false);

      showNotice(
        "Clip length updated"
      );
    } catch (e: any) {
      setError(
        e?.message ||
          "Failed to update clip."
      );
    } finally {
      setSavingClipLength(false);
    }
  }

  async function deleteCurrentClip() {
    if (!currentClip) return;

    const confirmed = window.confirm(
      "Delete this clip and every event attached to it?"
    );

    if (!confirmed) return;

    try {
      const supabase = supabaseBrowser();

      const { error: deleteError } =
        await supabase
          .from("clips")
          .delete()
          .eq("id", currentClip.id);

      if (deleteError) {
        throw new Error(
          deleteError.message
        );
      }

      const deletedClipId =
        currentClip.id;

      const remainingClips =
        clips.filter(
          (clip) =>
            clip.id !== deletedClipId
        );

      setClips(remainingClips);

      setEvents((existing) =>
        existing.filter(
          (event) =>
            event.clip_id !==
            deletedClipId
        )
      );

      setCurrentClipIndex(
        Math.max(
          0,
          Math.min(
            currentClipIndex,
            remainingClips.length - 1
          )
        )
      );

      resetEventForm();

      showNotice("Clip deleted");
    } catch (e: any) {
      setError(
        e?.message ||
          "Failed to delete clip."
      );
    }
  }

  function getPlayerLabel(
    playerId: string | null
  ) {
    if (!playerId) {
      return "TEAM";
    }

    const player = players.find(
      (item) =>
        item.id === playerId
    );

    if (!player) {
      return "Unknown Player";
    }

    const jersey =
      player.jersey_number !== null &&
      player.jersey_number !== undefined
        ? `#${player.jersey_number} `
        : "";

    return `${jersey}${player.name}`;
  }

  useEffect(() => {
    setMounted(true);

    return () => {
      if (noticeTimerRef.current) {
        clearTimeout(
          noticeTimerRef.current
        );
      }
    };
  }, []);

  useEffect(() => {
    if (!mounted || !gameId) {
      return;
    }

    loadWorkspace();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, gameId]);

  /*
    Whenever we change clips,
    jump to the clip start and
    automatically begin looping it.
  */
  useEffect(() => {
    if (
      !currentClip ||
      !currentVideo
    ) {
      return;
    }

    const timer = window.setTimeout(
      () => {
        const video =
          videoRef.current;

        if (!video) return;

        const start =
          numberValue(
            currentClip.start_seconds
          );

        video.currentTime = start;
        setCurrentTime(start);

        video
          .play()
          .catch(() => {});
      },
      150
    );

    return () =>
      window.clearTimeout(timer);
  }, [
    currentClip?.id,
    currentVideo?.signedUrl,
  ]);

  /*
    SHIFT remains Play / Pause
    in the tagging workspace.
  */
  useEffect(() => {
    if (!mounted) return;

    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (
        isTypingTarget(
          event.target
        )
      ) {
        return;
      }

      if (
        event.code === "ShiftLeft" ||
        event.code === "ShiftRight"
      ) {
        event.preventDefault();

        if (event.repeat) {
          return;
        }

        togglePlayback();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [mounted]);

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">
          Tag Clips
        </h1>

        <p className="muted">
          Loading clips…
        </p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="space-y-5">
        <h1 className="text-3xl font-bold">
          Can&apos;t open tagging
        </h1>

        {error ? (
          <div className="card border-red-700 text-red-300">
            {error}
          </div>
        ) : null}

        <button
          className="btn-ghost"
          onClick={() =>
            router.back()
          }
        >
          Go Back
        </button>
      </div>
    );
  }

  if (sortedClips.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-yellow-400 font-semibold">
            Step 2 of 2
          </div>

          <h1 className="text-3xl font-bold mt-1">
            Tag Clips
          </h1>
        </div>

        <div className="card text-center py-10">
          <div className="text-xl font-semibold">
            No clips yet
          </div>

          <p className="text-zinc-400 mt-2">
            Create event clips first,
            then come back here to tag
            them.
          </p>

          <button
            className="btn-primary mt-5"
            onClick={() =>
              router.push(
                `/games/${gameId}/tag`
              )
            }
          >
            Clip Events
          </button>
        </div>
      </div>
    );
  }

  const clipStart =
    currentClip
      ? numberValue(
          currentClip.start_seconds
        )
      : 0;

  const clipEnd =
    currentClip
      ? numberValue(
          currentClip.end_seconds
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* NOTICE */}
      {notice ? (
        <div className="fixed bottom-6 right-6 z-50 bg-yellow-400 text-black font-semibold rounded-xl px-5 py-3 shadow-2xl max-w-sm">
          ✓ {notice}
        </div>
      ) : null}

      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-yellow-400 font-semibold">
            Step 2 of 2
          </div>

          <h1 className="text-3xl font-bold mt-1">
            Tag Clips
          </h1>

          <p className="text-sm text-zinc-400 mt-2">
            Review each clip, tag every
            event inside it, then move
            to the next.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="btn-ghost"
            onClick={() =>
              router.push(
                `/games/${gameId}/tag`
              )
            }
          >
            Back to Clipping
          </button>

          <button
            className="btn-ghost"
            onClick={loadWorkspace}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* MATCH INFO */}
      <div className="card">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <div className="text-xs text-zinc-500">
              MATCH
            </div>

            <div className="font-semibold mt-1">
              {game.date} — vs{" "}
              {game.opponent ??
                "(Opponent?)"}
            </div>
          </div>

          <div className="text-sm text-zinc-400">
            {events.length} events
            tagged
          </div>
        </div>
      </div>

      {error ? (
        <div className="card border-red-700 text-red-300">
          {error}
        </div>
      ) : null}

      {/* CLIP NAVIGATION */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            className="btn-ghost"
            disabled={
              currentClipIndex === 0
            }
            onClick={previousClip}
          >
            ← Previous Clip
          </button>

          <div className="text-center">
            <div className="text-xs text-zinc-500">
              CURRENT CLIP
            </div>

            <div className="text-xl font-bold mt-1">
              {currentClipIndex + 1} of{" "}
              {sortedClips.length}
            </div>

            <div className="text-xs text-zinc-400 mt-1">
              {formatTime(clipStart)} →{" "}
              {formatTime(clipEnd)}
              {" • "}
              {(clipEnd - clipStart).toFixed(
                1
              )}
              s
            </div>
          </div>

          <button
            className="btn-primary"
            disabled={
              currentClipIndex >=
              sortedClips.length - 1
            }
            onClick={nextClip}
          >
            Next Clip →
          </button>
        </div>
      </div>

      {/* VIDEO */}
      <div className="card p-3 md:p-4">
        {currentVideo ? (
          <video
            key={currentVideo.signedUrl}
            ref={videoRef}
            src={currentVideo.signedUrl}
            controls
            playsInline
            preload="metadata"
            className="w-full max-h-[68vh] bg-black rounded-xl"
            onLoadedMetadata={() => {
              if (!videoRef.current) {
                return;
              }

              videoRef.current.currentTime =
                clipStart;

              setCurrentTime(clipStart);

              videoRef.current
                .play()
                .catch(() => {});
            }}
            onTimeUpdate={
              handleVideoTimeUpdate
            }
          >
            Your browser does not support
            video playback.
          </video>
        ) : (
          <div className="w-full aspect-video bg-black rounded-xl flex items-center justify-center text-zinc-400">
            Could not load this
            clip&apos;s video.
          </div>
        )}
      </div>

      {/* PLAYHEAD */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs text-zinc-500">
              EVENT PLAYHEAD
            </div>

            <div className="text-2xl font-mono font-bold text-yellow-300">
              {formatTime(currentTime)}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="btn-ghost"
              onClick={() => {
                const video =
                  videoRef.current;

                if (!video) return;

                video.currentTime =
                  Math.max(
                    clipStart,
                    video.currentTime -
                      0.5
                  );
              }}
            >
              −0.5 sec
            </button>

            <button
              className="btn-ghost"
              onClick={togglePlayback}
            >
              Play / Pause
            </button>

            <button
              className="btn-ghost"
              onClick={() => {
                const video =
                  videoRef.current;

                if (!video) return;

                video.currentTime =
                  Math.min(
                    clipEnd,
                    video.currentTime +
                      0.5
                  );
              }}
            >
              +0.5 sec
            </button>

            <button
              className="btn-ghost"
              onClick={playCurrentClip}
            >
              Restart Clip
            </button>
          </div>
        </div>

        <div className="text-xs text-zinc-500 mt-3">
          Shift = play / pause. Pause on
          the exact moment of an event,
          then tag it below.
        </div>
      </div>

      {/* EVENT TAGGER */}
      <div className="card space-y-5 border-yellow-500/30">
        <div>
          <div className="text-xs uppercase tracking-[0.15em] text-yellow-400 font-semibold">
            {editingEventId
              ? "Edit Event"
              : "Add Event"}
          </div>

          <h2 className="text-xl font-semibold mt-1">
            Who did what?
          </h2>

          <p className="text-sm text-zinc-400 mt-1">
            Event time:{" "}
            <span className="text-yellow-300 font-mono">
              {formatTime(currentTime)}
            </span>
          </p>
        </div>

        {/* PLAYER */}
        <div>
          <div className="text-xs text-zinc-500 mb-2">
            PLAYER / TEAM
          </div>

          <select
            className="select w-full"
            value={selectedPlayerId}
            onChange={(event) =>
              setSelectedPlayerId(
                event.target.value
              )
            }
          >
            <option value="team">
              TEAM
            </option>

            {players.map((player) => (
              <option
                key={player.id}
                value={player.id}
              >
                {player.jersey_number !==
                  null &&
                player.jersey_number !==
                  undefined
                  ? `#${player.jersey_number} — `
                  : ""}
                {player.name}
              </option>
            ))}
          </select>
        </div>

        {/* ACTIONS */}
        <div>
          <div className="text-xs text-zinc-500 mb-2">
            ACTION
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {ACTIONS.map((action) => (
              <button
                key={action}
                type="button"
                className={
                  selectedAction ===
                  action
                    ? "btn-primary"
                    : "btn-ghost"
                }
                onClick={() =>
                  setSelectedAction(
                    action
                  )
                }
              >
                {action}
              </button>
            ))}
          </div>
        </div>

        {/* AREA */}
        <div>
          <div className="text-xs text-zinc-500 mb-2">
            PITCH AREA — OPTIONAL
          </div>

          <select
            className="select w-full"
            value={selectedArea}
            onChange={(event) =>
              setSelectedArea(
                event.target.value
              )
            }
          >
            <option value="">
              No area selected
            </option>

            {AREAS.map((area) => (
              <option
                key={area}
                value={area}
              >
                {area}
              </option>
            ))}
          </select>
        </div>

        {/* NOTES */}
        <div>
          <div className="text-xs text-zinc-500 mb-2">
            NOTES — OPTIONAL
          </div>

          <textarea
            className="input w-full min-h-24"
            value={notes}
            onChange={(event) =>
              setNotes(
                event.target.value
              )
            }
            placeholder="Anything useful about this event…"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="btn-primary"
            disabled={savingEvent}
            onClick={saveEvent}
          >
            {savingEvent
              ? "Saving…"
              : editingEventId
              ? "Save Changes"
              : "Add Event"}
          </button>

          {editingEventId ? (
            <button
              className="btn-ghost"
              disabled={savingEvent}
              onClick={resetEventForm}
            >
              Cancel Edit
            </button>
          ) : null}
        </div>
      </div>

      {/* EVENTS IN THIS CLIP */}
      <div className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">
              Events in This Clip
            </h2>

            <p className="text-sm text-zinc-400 mt-1">
              A clip can contain as many
              player or Team events as
              needed.
            </p>
          </div>

          <div className="text-sm text-zinc-400">
            {currentClipEvents.length}{" "}
            events
          </div>
        </div>

        {currentClipEvents.length ===
        0 ? (
          <div className="border border-dashed border-zinc-700 rounded-xl p-8 text-center">
            <div className="font-semibold">
              No events tagged yet
            </div>

            <div className="text-sm text-zinc-400 mt-2">
              Pause on an event, choose
              the player and action, then
              Add Event.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {currentClipEvents.map(
              (event, index) => (
                <div
                  key={event.id}
                  className="border border-zinc-800 bg-black/30 rounded-xl p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-zinc-500">
                          EVENT{" "}
                          {index + 1}
                        </span>

                        <span className="text-xs border border-zinc-700 rounded-md px-2 py-1">
                          {formatTime(
                            numberValue(
                              event.event_seconds
                            )
                          )}
                        </span>
                      </div>

                      <div className="font-semibold mt-2">
                        {getPlayerLabel(
                          event.player_id
                        )}
                        {" — "}
                        <span className="text-yellow-300">
                          {event.action}
                        </span>
                      </div>

                      {event.area ? (
                        <div className="text-sm text-zinc-400 mt-1">
                          {event.area}
                        </div>
                      ) : null}

                      {event.notes ? (
                        <div className="text-sm text-zinc-400 mt-1">
                          {event.notes}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        className="btn-ghost"
                        onClick={() => {
                          const video =
                            videoRef.current;

                          if (!video) {
                            return;
                          }

                          const time =
                            numberValue(
                              event.event_seconds
                            );

                          video.currentTime =
                            time;

                          setCurrentTime(
                            time
                          );

                          video
                            .play()
                            .catch(
                              () => {}
                            );
                        }}
                      >
                        Watch
                      </button>

                      <button
                        className="btn-ghost"
                        onClick={() =>
                          duplicateEvent(
                            event
                          )
                        }
                      >
                        Duplicate
                      </button>

                      <button
                        className="btn-ghost"
                        onClick={() =>
                          editEvent(event)
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="btn-danger"
                        onClick={() =>
                          deleteEvent(
                            event
                          )
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* CLIP LENGTH */}
      <div className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">
              Clip Length
            </h2>

            <p className="text-sm text-zinc-400 mt-1">
              Tighten this clip or
              lengthen it if the event
              needs more context.
            </p>
          </div>

          {!editingClipLength ? (
            <button
              className="btn-ghost"
              onClick={
                beginClipLengthEdit
              }
            >
              Edit Length
            </button>
          ) : null}
        </div>

        {!editingClipLength ? (
          <div className="text-sm text-zinc-300">
            {formatTime(clipStart)}
            {" → "}
            {formatTime(clipEnd)}
            {" • "}
            {(clipEnd - clipStart).toFixed(
              1
            )}
            s
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-2">
                <span className="text-xs text-zinc-400">
                  Start seconds
                </span>

                <input
                  className="input w-full"
                  type="number"
                  min={0}
                  step={0.1}
                  value={
                    clipStartDraft ?? 0
                  }
                  onChange={(event) =>
                    setClipStartDraft(
                      Number(
                        event.target.value
                      )
                    )
                  }
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs text-zinc-400">
                  End seconds
                </span>

                <input
                  className="input w-full"
                  type="number"
                  min={0}
                  step={0.1}
                  value={
                    clipEndDraft ?? 0
                  }
                  onChange={(event) =>
                    setClipEndDraft(
                      Number(
                        event.target.value
                      )
                    )
                  }
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                className="btn-ghost"
                onClick={() =>
                  setClipStartDraft(
                    Number(
                      Math.max(
                        0,
                        (clipStartDraft ??
                          clipStart) -
                          0.5
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
                  setClipStartDraft(
                    Number(
                      (
                        (clipStartDraft ??
                          clipStart) +
                        0.5
                      ).toFixed(1)
                    )
                  )
                }
              >
                Start +0.5s
              </button>

              <button
                className="btn-ghost"
                onClick={() =>
                  setClipEndDraft(
                    Number(
                      Math.max(
                        0,
                        (clipEndDraft ??
                          clipEnd) -
                          0.5
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
                  setClipEndDraft(
                    Number(
                      (
                        (clipEndDraft ??
                          clipEnd) +
                        0.5
                      ).toFixed(1)
                    )
                  )
                }
              >
                End +0.5s
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                className="btn-primary"
                disabled={
                  savingClipLength
                }
                onClick={
                  saveClipLength
                }
              >
                {savingClipLength
                  ? "Saving…"
                  : "Save Length"}
              </button>

              <button
                className="btn-ghost"
                disabled={
                  savingClipLength
                }
                onClick={() =>
                  setEditingClipLength(
                    false
                  )
                }
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DELETE CLIP */}
      <div className="card border-red-900/50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-semibold">
              Delete Clip
            </div>

            <div className="text-sm text-zinc-400 mt-1">
              This also deletes every
              tagged event attached to
              this clip.
            </div>
          </div>

          <button
            className="btn-danger"
            onClick={
              deleteCurrentClip
            }
          >
            Delete This Clip
          </button>
        </div>
      </div>

      <div className="text-xs text-zinc-500 pb-6">
        One clip can contain multiple
        players, multiple actions and
        Team events • Duplicate copies
        an event so you can quickly
        create a related event
      </div>
    </div>
  );
}
