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
  status: string;
  type: string | null;
  date: string | null;
  opponent: string | null;
};

type PlayerRow = {
  id: string;
  name: string;
  jersey_number: number | string | null;
  position: string | null;
  status: string | null;
};

type ClipRow = {
  id: string;
  game_id: string;
  created_by: string;
  video_path: string;
  start_seconds: number | string;
  end_seconds: number | string;
};

type ClipEventRow = {
  id: string;
  clip_id: string;
  game_id: string;
  player_id: string | null;
  created_by: string;
  action: string;
  event_seconds: number | string;
  outcome: string | null;
  field_zone: string | null;
  area: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type VideoFile = {
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

const FIELD_ZONES = [
  {
    id: "attacking_left",
    short: "AL",
    label: "Attacking Left",
  },
  {
    id: "attacking_center",
    short: "AC",
    label: "Attacking Center",
  },
  {
    id: "attacking_right",
    short: "AR",
    label: "Attacking Right",
  },
  {
    id: "middle_left",
    short: "ML",
    label: "Middle Left",
  },
  {
    id: "middle_center",
    short: "MC",
    label: "Middle Center",
  },
  {
    id: "middle_right",
    short: "MR",
    label: "Middle Right",
  },
  {
    id: "defensive_left",
    short: "DL",
    label: "Defensive Left",
  },
  {
    id: "defensive_center",
    short: "DC",
    label: "Defensive Center",
  },
  {
    id: "defensive_right",
    short: "DR",
    label: "Defensive Right",
  },
] as const;

const TRIM_AMOUNTS = [-2, -1, -0.5, 0.5, 1, 2];

function numberValue(value: number | string) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
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

function formatTrimAmount(amount: number) {
  return amount > 0 ? `+${amount}` : `${amount}`;
}

function isTypingTarget(target: EventTarget | null) {
  if (!target) return false;

  const element = target as HTMLElement;
  const tag = element.tagName?.toLowerCase();

  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
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

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [game, setGame] = useState<GameRow | null>(null);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [clips, setClips] = useState<ClipRow[]>([]);
  const [events, setEvents] = useState<ClipEventRow[]>([]);
  const [videos, setVideos] = useState<VideoFile[]>([]);

  const [userId, setUserId] = useState("");

  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const [selectedPlayerId, setSelectedPlayerId] =
    useState<string>("");

  const [selectedAction, setSelectedAction] =
    useState<string>("");

  const [selectedOutcome, setSelectedOutcome] =
    useState<string>("");

  const [selectedZone, setSelectedZone] =
    useState<string>("");

  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  const [editingEventId, setEditingEventId] =
    useState<string | null>(null);

  const [savingEvent, setSavingEvent] = useState(false);
  const [savingTrim, setSavingTrim] = useState(false);

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
          Math.min(currentClipIndex, sortedClips.length - 1)
        ]
      : null;

  const currentVideo = useMemo(() => {
    if (!currentClip) return null;

    return (
      videos.find(
        (video) => video.path === currentClip.video_path
      ) ?? null
    );
  }, [currentClip, videos]);

  const currentClipEvents = useMemo(() => {
    if (!currentClip) return [];

    return events
      .filter((event) => event.clip_id === currentClip.id)
      .sort(
        (a, b) =>
          numberValue(a.event_seconds) -
          numberValue(b.event_seconds)
      );
  }, [events, currentClip]);

  const clipStart = currentClip
    ? numberValue(currentClip.start_seconds)
    : 0;

  const clipEnd = currentClip
    ? numberValue(currentClip.end_seconds)
    : 0;

  const clipDuration = Math.max(0, clipEnd - clipStart);

  function showNoticeMessage(message: string) {
    setNotice(message);

    if (noticeTimerRef.current) {
      clearTimeout(noticeTimerRef.current);
    }

    noticeTimerRef.current = setTimeout(() => {
      setNotice(null);
    }, 1500);
  }

  function resetTagger(options?: {
    keepPlayer?: boolean;
    keepZone?: boolean;
  }) {
    if (!options?.keepPlayer) {
      setSelectedPlayerId("");
    }

    setSelectedAction("");
    setSelectedOutcome("");

    if (!options?.keepZone) {
      setSelectedZone("");
    }

    setNotes("");
    setShowNotes(false);
    setEditingEventId(null);
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
        throw new Error("You must be signed in.");
      }

      setUserId(user.id);

      const response = await fetch(`/api/games/${gameId}`, {
        cache: "no-store",
      });

      const json = await response.json();

      if (!response.ok || !json.ok) {
        throw new Error(
          json?.error || "Failed to load game."
        );
      }

      const loadedGame = json.data as GameRow;
      setGame(loadedGame);

      const [playersResult, clipsResult, eventsResult] =
        await Promise.all([
          supabase
            .from("players")
            .select(
              "id,name,jersey_number,position,status"
            )
            .eq("team_id", loadedGame.team_id)
            .order("jersey_number", {
              ascending: true,
            }),

          supabase
            .from("clips")
            .select(
              "id,game_id,created_by,video_path,start_seconds,end_seconds"
            )
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

      const paths = Array.from(
        new Set(
          loadedClips.map((clip) => clip.video_path)
        )
      );

      const loadedVideos: VideoFile[] = [];

      for (const path of paths) {
        const { data, error: signedError } =
          await supabase.storage
            .from("match-videos")
            .createSignedUrl(path, 60 * 60 * 6);

        if (signedError || !data?.signedUrl) {
          continue;
        }

        loadedVideos.push({
          path,
          signedUrl: data.signedUrl,
        });
      }

      setVideos(loadedVideos);
      setCurrentClipIndex(0);
    } catch (e: any) {
      setError(
        e?.message ||
          "Failed to load tagging workspace."
      );
    } finally {
      setLoading(false);
    }
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

  function restartClip() {
    const video = videoRef.current;

    if (!video || !currentClip) return;

    video.currentTime = clipStart;
    setCurrentTime(clipStart);
    video.play().catch(() => {});
  }

  function handleTimeUpdate() {
    const video = videoRef.current;

    if (!video || !currentClip) return;

    setCurrentTime(video.currentTime);

    if (video.currentTime >= clipEnd) {
      video.currentTime = clipStart;
      setCurrentTime(clipStart);
      video.play().catch(() => {});
    }
  }

  function movePlayhead(amount: number) {
    const video = videoRef.current;

    if (!video) return;

    const next = Math.max(
      clipStart,
      Math.min(clipEnd, video.currentTime + amount)
    );

    video.currentTime = next;
    setCurrentTime(next);
  }

  function goToClip(index: number) {
    if (index < 0 || index >= sortedClips.length) {
      return;
    }

    setCurrentClipIndex(index);
    resetTagger();
  }

  function previousClip() {
    goToClip(Math.max(0, currentClipIndex - 1));
  }

  function nextClip() {
    goToClip(
      Math.min(
        sortedClips.length - 1,
        currentClipIndex + 1
      )
    );
  }

  async function adjustClipBoundary(
    boundary: "start" | "end",
    amount: number
  ) {
    if (!currentClip || savingTrim) return;

    const oldStart = clipStart;
    const oldEnd = clipEnd;

    let newStart = oldStart;
    let newEnd = oldEnd;

    if (boundary === "start") {
      newStart = Math.max(
        0,
        Number((oldStart + amount).toFixed(3))
      );
    } else {
      newEnd = Math.max(
        0,
        Number((oldEnd + amount).toFixed(3))
      );
    }

    /*
      Always leave at least 0.5 seconds between
      the beginning and end of the clip.
    */
    if (newEnd - newStart < 0.5) {
      setError(
        "The clip must be at least 0.5 seconds long."
      );
      return;
    }

    setSavingTrim(true);
    setError(null);

    try {
      const supabase = supabaseBrowser();

      const { data, error: updateError } =
        await supabase
          .from("clips")
          .update({
            start_seconds: newStart,
            end_seconds: newEnd,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentClip.id)
          .select(
            "id,game_id,created_by,video_path,start_seconds,end_seconds"
          )
          .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      const updatedClip = data as ClipRow;

      setClips((existing) =>
        existing.map((clip) =>
          clip.id === currentClip.id
            ? updatedClip
            : clip
        )
      );

      /*
        Immediately restart the video using the new
        boundaries so the coach can judge the trim
        without pressing Save or scrolling away.
      */
      const video = videoRef.current;

      if (video) {
        const updatedStart = numberValue(
          updatedClip.start_seconds
        );

        video.currentTime = updatedStart;
        setCurrentTime(updatedStart);

        video.play().catch(() => {});
      }

      showNoticeMessage(
        boundary === "start"
          ? "Clip start updated"
          : "Clip end updated"
      );
    } catch (e: any) {
      setError(
        e?.message || "Failed to adjust clip."
      );
    } finally {
      setSavingTrim(false);
    }
  }

  async function saveEvent() {
    if (!currentClip || !userId) return;

    if (!selectedPlayerId) {
      setError("Choose a player or Team.");
      return;
    }

    if (!selectedAction) {
      setError("Choose an action.");
      return;
    }

    if (!selectedOutcome) {
      setError(
        "Choose Successful or Unsuccessful."
      );
      return;
    }

    if (!selectedZone) {
      setError("Choose a field location.");
      return;
    }

    setSavingEvent(true);
    setError(null);

    try {
      const supabase = supabaseBrowser();

      let eventSeconds = currentTime;

      if (
        eventSeconds < clipStart ||
        eventSeconds > clipEnd
      ) {
        eventSeconds = clipStart;
      }

      const payload = {
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
        outcome: selectedOutcome,
        field_zone: selectedZone,
        area: null,
        notes: notes.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (editingEventId) {
        const { data, error: updateError } =
          await supabase
            .from("clip_events")
            .update(payload)
            .eq("id", editingEventId)
            .select("*")
            .single();

        if (updateError) {
          throw new Error(updateError.message);
        }

        setEvents((existing) =>
          existing.map((event) =>
            event.id === editingEventId
              ? (data as ClipEventRow)
              : event
          )
        );

        showNoticeMessage("Event updated");
      } else {
        const { data, error: insertError } =
          await supabase
            .from("clip_events")
            .insert(payload)
            .select("*")
            .single();

        if (insertError) {
          throw new Error(insertError.message);
        }

        setEvents((existing) => [
          ...existing,
          data as ClipEventRow,
        ]);

        showNoticeMessage("Event added");
      }

      resetTagger({
        keepPlayer: true,
      });
    } catch (e: any) {
      setError(
        e?.message || "Failed to save event."
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
    setSelectedOutcome(event.outcome ?? "");
    setSelectedZone(event.field_zone ?? "");
    setNotes(event.notes ?? "");
    setShowNotes(Boolean(event.notes));

    const video = videoRef.current;

    if (video) {
      const time = numberValue(
        event.event_seconds
      );

      video.currentTime = time;
      setCurrentTime(time);
      video.pause();
    }
  }

  function duplicateEvent(event: ClipEventRow) {
    setEditingEventId(null);

    setSelectedPlayerId(
      event.player_id ?? "team"
    );
    setSelectedAction(event.action);
    setSelectedOutcome(event.outcome ?? "");
    setSelectedZone(event.field_zone ?? "");
    setNotes(event.notes ?? "");
    setShowNotes(Boolean(event.notes));

    const video = videoRef.current;

    if (video) {
      const time = numberValue(
        event.event_seconds
      );

      video.currentTime = time;
      setCurrentTime(time);
      video.pause();
    }

    showNoticeMessage(
      "Event copied — change anything, then Add"
    );
  }

  async function deleteEvent(eventId: string) {
    const ok = window.confirm(
      "Delete this event?"
    );

    if (!ok) return;

    try {
      const supabase = supabaseBrowser();

      const { error: deleteError } =
        await supabase
          .from("clip_events")
          .delete()
          .eq("id", eventId);

      if (deleteError) {
        throw new Error(
          deleteError.message
        );
      }

      setEvents((existing) =>
        existing.filter(
          (event) => event.id !== eventId
        )
      );

      if (editingEventId === eventId) {
        resetTagger();
      }

      showNoticeMessage("Event deleted");
    } catch (e: any) {
      setError(
        e?.message || "Failed to delete event."
      );
    }
  }

  function playerLabel(
    playerId: string | null
  ) {
    if (!playerId) return "TEAM";

    const player = players.find(
      (item) => item.id === playerId
    );

    if (!player) return "Player";

    const jersey =
      player.jersey_number !== null &&
      player.jersey_number !== undefined
        ? `#${player.jersey_number} `
        : "";

    return `${jersey}${player.name}`;
  }

  function zoneLabel(zone: string | null) {
    if (!zone) return "No location";

    return (
      FIELD_ZONES.find(
        (item) => item.id === zone
      )?.label ?? zone
    );
  }

  async function deleteCurrentClip() {
    if (!currentClip) return;

    const ok = window.confirm(
      "Delete this clip and all events attached to it?"
    );

    if (!ok) return;

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

      const deletedId = currentClip.id;

      const remaining = clips.filter(
        (clip) => clip.id !== deletedId
      );

      setClips(remaining);

      setEvents((existing) =>
        existing.filter(
          (event) =>
            event.clip_id !== deletedId
        )
      );

      setCurrentClipIndex((index) =>
        Math.max(
          0,
          Math.min(
            index,
            remaining.length - 1
          )
        )
      );

      resetTagger();

      showNoticeMessage("Clip deleted");
    } catch (e: any) {
      setError(
        e?.message || "Failed to delete clip."
      );
    }
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
    if (!mounted || !gameId) return;

    loadWorkspace();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, gameId]);

  useEffect(() => {
    if (!currentClip || !currentVideo) {
      return;
    }

    const timer = window.setTimeout(() => {
      const video = videoRef.current;

      if (!video) return;

      const start = numberValue(
        currentClip.start_seconds
      );

      video.currentTime = start;
      setCurrentTime(start);

      video.play().catch(() => {});
    }, 120);

    return () =>
      window.clearTimeout(timer);
  }, [
    currentClip?.id,
    currentVideo?.signedUrl,
  ]);

  useEffect(() => {
    if (!mounted) return;

    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (isTypingTarget(event.target)) {
        return;
      }

      if (
        event.code === "ShiftLeft" ||
        event.code === "ShiftRight"
      ) {
        event.preventDefault();

        if (event.repeat) return;

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

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">
          Tag Clips
        </h1>

        <p className="muted">
          Loading tagging workspace…
        </p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="space-y-4">
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
          onClick={() => router.back()}
        >
          Go Back
        </button>
      </div>
    );
  }

  if (sortedClips.length === 0) {
    return (
      <div className="space-y-5">
        <h1 className="text-3xl font-bold">
          Tag Clips
        </h1>

        <div className="card text-center py-10">
          <div className="font-semibold text-xl">
            No clips yet
          </div>

          <p className="text-sm text-zinc-400 mt-2">
            Create clips first, then tag the
            events inside them.
          </p>

          <button
            className="btn-primary mt-5"
            onClick={() =>
              router.push(
                `/games/${gameId}/tag`
              )
            }
          >
            Go to Clip Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {notice ? (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-yellow-400 px-4 py-3 font-bold text-black shadow-2xl">
          ✓ {notice}
        </div>
      ) : null}

      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-yellow-400">
            Step 2 of 2
          </div>

          <h1 className="text-2xl font-bold">
            Tag Clips
          </h1>

          <div className="mt-1 text-xs text-zinc-400">
            {game.date} • vs{" "}
            {game.opponent ?? "Opponent"}
          </div>
        </div>

        <button
          className="btn-ghost"
          onClick={() =>
            router.push(
              `/games/${gameId}/tag`
            )
          }
        >
          ← Clipping
        </button>
      </div>

      {error ? (
        <div className="card border-red-700 text-red-300">
          {error}
        </div>
      ) : null}

      {/* CLIP NAV */}
      <div className="card py-3">
        <div className="grid grid-cols-3 items-center gap-3">
          <button
            className="btn-ghost"
            disabled={currentClipIndex === 0}
            onClick={previousClip}
          >
            ← Previous
          </button>

          <div className="text-center">
            <div className="font-bold">
              Clip {currentClipIndex + 1} /{" "}
              {sortedClips.length}
            </div>

            <div className="text-xs text-zinc-400">
              {formatTime(clipStart)} –{" "}
              {formatTime(clipEnd)}
              {" • "}
              {clipDuration.toFixed(1)}s
              {" • "}
              {currentClipEvents.length} events
            </div>
          </div>

          <button
            className="btn-primary"
            disabled={
              currentClipIndex ===
              sortedClips.length - 1
            }
            onClick={nextClip}
          >
            Next →
          </button>
        </div>
      </div>

      {/* VIDEO + LIVE TRIM */}
      <div className="card space-y-3 p-2 md:p-3">
        {currentVideo ? (
          <video
            key={currentVideo.signedUrl}
            ref={videoRef}
            src={currentVideo.signedUrl}
            controls
            playsInline
            preload="metadata"
            className="w-full max-h-[68vh] rounded-xl bg-black"
            onLoadedMetadata={() => {
              const video =
                videoRef.current;

              if (!video) return;

              video.currentTime =
                clipStart;

              setCurrentTime(clipStart);

              video.play().catch(() => {});
            }}
            onTimeUpdate={handleTimeUpdate}
          />
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-xl bg-black text-zinc-400">
            Video unavailable
          </div>
        )}

        {/* LIVE CLIP TRIMMER */}
        <div className="rounded-xl border border-zinc-800 bg-black/25 p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-yellow-400">
                Live Clip Trim
              </div>

              <div className="mt-1 text-sm">
                <span className="font-mono font-bold">
                  {formatTime(clipStart)}
                </span>
                {" → "}
                <span className="font-mono font-bold">
                  {formatTime(clipEnd)}
                </span>

                <span className="ml-2 text-zinc-500">
                  ({clipDuration.toFixed(1)}s)
                </span>
              </div>
            </div>

            <div className="text-xs text-zinc-500">
              {savingTrim
                ? "Saving adjustment…"
                : "Every adjustment saves automatically"}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {/* START */}
            <div className="rounded-xl border border-zinc-800 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Clip Start
                  </div>

                  <div className="font-mono text-lg font-bold text-yellow-300">
                    {formatTime(clipStart)}
                  </div>
                </div>

                <div className="text-xs text-zinc-500">
                  Beginning
                </div>
              </div>

              <div className="grid grid-cols-6 gap-1.5">
                {TRIM_AMOUNTS.map(
                  (amount) => (
                    <button
                      key={`start-${amount}`}
                      type="button"
                      disabled={savingTrim}
                      className="btn-ghost px-1 py-2 text-xs"
                      onClick={() =>
                        adjustClipBoundary(
                          "start",
                          amount
                        )
                      }
                    >
                      {formatTrimAmount(
                        amount
                      )}
                    </button>
                  )
                )}
              </div>

              <div className="mt-2 text-[11px] leading-5 text-zinc-500">
                Negative adds time before the
                clip. Positive trims the
                beginning.
              </div>
            </div>

            {/* END */}
            <div className="rounded-xl border border-zinc-800 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Clip End
                  </div>

                  <div className="font-mono text-lg font-bold text-yellow-300">
                    {formatTime(clipEnd)}
                  </div>
                </div>

                <div className="text-xs text-zinc-500">
                  Ending
                </div>
              </div>

              <div className="grid grid-cols-6 gap-1.5">
                {TRIM_AMOUNTS.map(
                  (amount) => (
                    <button
                      key={`end-${amount}`}
                      type="button"
                      disabled={savingTrim}
                      className="btn-ghost px-1 py-2 text-xs"
                      onClick={() =>
                        adjustClipBoundary(
                          "end",
                          amount
                        )
                      }
                    >
                      {formatTrimAmount(
                        amount
                      )}
                    </button>
                  )
                )}
              </div>

              <div className="mt-2 text-[11px] leading-5 text-zinc-500">
                Negative trims the ending.
                Positive adds more time after
                the clip.
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800 pt-3">
            <div className="text-xs text-zinc-500">
              Watch the loop, tap a trim
              button, and the updated clip
              restarts automatically.
            </div>

            <button
              className="btn-danger"
              onClick={deleteCurrentClip}
            >
              Delete Clip
            </button>
          </div>
        </div>
      </div>

      {/* PLAYBACK BAR */}
      <div className="card py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] text-zinc-500">
              EVENT TIME
            </div>

            <div className="font-mono text-xl font-bold text-yellow-300">
              {formatTime(currentTime)}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="btn-ghost"
              onClick={() =>
                movePlayhead(-0.5)
              }
            >
              −0.5
            </button>

            <button
              className="btn-ghost"
              onClick={togglePlayback}
            >
              Play / Pause
            </button>

            <button
              className="btn-ghost"
              onClick={() =>
                movePlayhead(0.5)
              }
            >
              +0.5
            </button>

            <button
              className="btn-ghost"
              onClick={restartClip}
            >
              Restart
            </button>
          </div>

          <div className="text-xs text-zinc-500">
            Shift = Play / Pause
          </div>
        </div>
      </div>

      {/* TAGGING CONSOLE */}
      <div className="card space-y-4 border-yellow-500/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-yellow-400">
              {editingEventId
                ? "Edit Event"
                : "New Event"}
            </div>

            <div className="font-semibold">
              Player → Action → Outcome →
              Location
            </div>
          </div>

          {editingEventId ? (
            <button
              className="btn-ghost"
              onClick={() =>
                resetTagger()
              }
            >
              Cancel Edit
            </button>
          ) : null}
        </div>

        {/* PLAYER */}
        <div>
          <div className="mb-2 text-xs text-zinc-500">
            1. PLAYER
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              type="button"
              className={
                selectedPlayerId === "team"
                  ? "btn-primary whitespace-nowrap"
                  : "btn-ghost whitespace-nowrap"
              }
              onClick={() =>
                setSelectedPlayerId("team")
              }
            >
              TEAM
            </button>

            {players.map((player) => (
              <button
                key={player.id}
                type="button"
                className={
                  selectedPlayerId ===
                  player.id
                    ? "btn-primary whitespace-nowrap"
                    : "btn-ghost whitespace-nowrap"
                }
                onClick={() =>
                  setSelectedPlayerId(
                    player.id
                  )
                }
              >
                {player.jersey_number !==
                  null &&
                player.jersey_number !==
                  undefined
                  ? `#${player.jersey_number} `
                  : ""}
                {player.name}
              </button>
            ))}
          </div>
        </div>

        {/* ACTION + OUTCOME */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_230px]">
          <div>
            <div className="mb-2 text-xs text-zinc-500">
              2. ACTION
            </div>

            <div className="grid grid-cols-3 gap-2">
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

          <div>
            <div className="mb-2 text-xs text-zinc-500">
              3. OUTCOME
            </div>

            <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
              <button
                type="button"
                className={
                  selectedOutcome ===
                  "successful"
                    ? "btn-primary"
                    : "btn-ghost"
                }
                onClick={() =>
                  setSelectedOutcome(
                    "successful"
                  )
                }
              >
                ✓ Successful
              </button>

              <button
                type="button"
                className={
                  selectedOutcome ===
                  "unsuccessful"
                    ? "btn-primary"
                    : "btn-ghost"
                }
                onClick={() =>
                  setSelectedOutcome(
                    "unsuccessful"
                  )
                }
              >
                ✕ Unsuccessful
              </button>
            </div>
          </div>
        </div>

        {/* PORTRAIT PITCH + SAVE */}
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[300px_1fr]">
          <div>
            <div className="mb-2 text-xs text-zinc-500">
              4. EVENT LOCATION
            </div>

            <div className="mx-auto w-full max-w-[280px]">
              <div className="mb-2 text-center">
                <div className="text-xs font-bold tracking-[0.18em] text-yellow-400">
                  ↑ ATTACKING ↑
                </div>

                <div className="mt-1 text-[10px] text-zinc-500">
                  Left / Center / Right are
                  from your team&apos;s
                  attacking perspective
                </div>
              </div>

              {/* UPRIGHT FIELD */}
              <div className="relative mx-auto aspect-[0.68/1] w-full overflow-hidden rounded-xl border-2 border-white/50 bg-emerald-900/30">
                {/* Halfway line */}
                <div className="pointer-events-none absolute left-0 right-0 top-1/2 z-20 border-t border-white/35" />

                {/* Center circle */}
                <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/35" />

                <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40" />

                {/* Top penalty area */}
                <div className="pointer-events-none absolute left-1/2 top-0 z-20 h-[14%] w-[55%] -translate-x-1/2 border border-t-0 border-white/30" />

                {/* Bottom penalty area */}
                <div className="pointer-events-none absolute bottom-0 left-1/2 z-20 h-[14%] w-[55%] -translate-x-1/2 border border-b-0 border-white/30" />

                {/* 3 x 3 event grid */}
                <div className="absolute inset-0 z-10 grid grid-cols-3 grid-rows-3">
                  {FIELD_ZONES.map(
                    (zone) => (
                      <button
                        key={zone.id}
                        type="button"
                        title={zone.label}
                        className={`border border-white/20 text-xs font-black transition ${
                          selectedZone ===
                          zone.id
                            ? "bg-yellow-400 text-black"
                            : "bg-transparent text-white hover:bg-white/10"
                        }`}
                        onClick={() =>
                          setSelectedZone(
                            zone.id
                          )
                        }
                      >
                        {zone.short}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="mt-2 text-center text-xs font-bold tracking-[0.18em] text-zinc-400">
                ↓ DEFENDING ↓
              </div>

              <div className="mt-2 text-center text-xs">
                {selectedZone
                  ? zoneLabel(
                      selectedZone
                    )
                  : "Click one of the 9 field zones"}
              </div>
            </div>
          </div>

          {/* SAVE EVENT */}
          <div className="space-y-3">
            <div className="rounded-xl border border-zinc-800 bg-black/20 p-3 text-sm">
              <div className="mb-1 text-xs text-zinc-500">
                EVENT
              </div>

              <div className="font-semibold">
                {selectedPlayerId
                  ? selectedPlayerId ===
                    "team"
                    ? "TEAM"
                    : playerLabel(
                        selectedPlayerId
                      )
                  : "Choose player"}
                {" • "}
                {selectedAction ||
                  "Choose action"}
              </div>

              <div className="mt-1 text-xs text-zinc-400">
                {selectedOutcome
                  ? selectedOutcome ===
                    "successful"
                    ? "Successful"
                    : "Unsuccessful"
                  : "Choose outcome"}
                {" • "}
                {selectedZone
                  ? zoneLabel(
                      selectedZone
                    )
                  : "Choose location"}
                {" • "}
                {formatTime(currentTime)}
              </div>
            </div>

            <button
              className="btn-primary w-full"
              disabled={savingEvent}
              onClick={saveEvent}
            >
              {savingEvent
                ? "Saving…"
                : editingEventId
                ? "Save Event"
                : "Add Event"}
            </button>

            <div className="rounded-xl border border-zinc-800 bg-black/20 p-3">
              <div className="text-xs font-semibold text-zinc-300">
                Multiple events are allowed
              </div>

              <div className="mt-1 text-xs leading-5 text-zinc-500">
                Every time you press Add
                Event, that event is saved
                immediately. Keep tagging
                this same clip as many times
                as needed.
              </div>
            </div>

            <button
              className="btn-ghost w-full"
              onClick={() =>
                setShowNotes(
                  (value) => !value
                )
              }
            >
              {showNotes
                ? "Hide Notes"
                : "+ Optional Note"}
            </button>

            {showNotes ? (
              <textarea
                className="input min-h-20 w-full"
                value={notes}
                onChange={(event) =>
                  setNotes(
                    event.target.value
                  )
                }
                placeholder="Optional coaching note…"
              />
            ) : null}
          </div>
        </div>
      </div>

      {/* EVENT TRAY */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold">
              Saved Events in This Clip
            </div>

            <div className="text-xs text-zinc-500">
              These events are already saved
              to InsightFC.
            </div>
          </div>

          <div className="rounded-lg bg-yellow-400 px-3 py-1 text-sm font-black text-black">
            {currentClipEvents.length}
          </div>
        </div>

        {currentClipEvents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-700 p-4 text-center text-sm text-zinc-500">
            No events tagged in this clip
            yet.
          </div>
        ) : (
          <div className="space-y-2">
            {currentClipEvents.map(
              (event) => (
                <div
                  key={event.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-black/25 px-3 py-2"
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="font-mono text-yellow-300">
                      {formatTime(
                        numberValue(
                          event.event_seconds
                        )
                      )}
                    </span>

                    <span className="font-semibold">
                      {playerLabel(
                        event.player_id
                      )}
                    </span>

                    <span>
                      {event.action}
                    </span>

                    <span
                      className={
                        event.outcome ===
                        "successful"
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >
                      {event.outcome ===
                      "successful"
                        ? "✓"
                        : event.outcome ===
                          "unsuccessful"
                        ? "✕"
                        : "—"}
                    </span>

                    <span className="text-zinc-400">
                      {zoneLabel(
                        event.field_zone
                      )}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      className="btn-ghost"
                      onClick={() => {
                        const video =
                          videoRef.current;

                        if (!video) return;

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
                          .catch(() => {});
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
                          event.id
                        )
                      }
                    >
                      ×
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-semibold">
              Clip {currentClipIndex + 1} of{" "}
              {sortedClips.length}
            </div>

            <div className="text-xs text-zinc-500">
              {currentClipEvents.length}{" "}
              saved event
              {currentClipEvents.length ===
              1
                ? ""
                : "s"}{" "}
              in this clip
            </div>
          </div>

          <div className="flex gap-2">
            <button
              className="btn-ghost"
              disabled={
                currentClipIndex === 0
              }
              onClick={previousClip}
            >
              ← Previous
            </button>

            <button
              className="btn-primary"
              disabled={
                currentClipIndex ===
                sortedClips.length - 1
              }
              onClick={nextClip}
            >
              Next Clip →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
