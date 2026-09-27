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
  { label: "Pass", key: "P" },
  { label: "Carry 10+ yd", key: "C" },
  { label: "Take-on", key: "T" },
  { label: "Shot", key: "S" },
  { label: "Goal", key: "G" },
  { label: "Assist", key: "A" },
  { label: "Possession Won", key: "W" },
  { label: "Pressure", key: "R" },
] as const;

const FIELD_ZONES = [
  { id: "attacking_left", short: "AL", label: "Attacking Left" },
  { id: "attacking_center", short: "AC", label: "Attacking Center" },
  { id: "attacking_right", short: "AR", label: "Attacking Right" },
  { id: "middle_left", short: "ML", label: "Middle Left" },
  { id: "middle_center", short: "MC", label: "Middle Center" },
  { id: "middle_right", short: "MR", label: "Middle Right" },
  { id: "defensive_left", short: "DL", label: "Defensive Left" },
  { id: "defensive_center", short: "DC", label: "Defensive Center" },
  { id: "defensive_right", short: "DR", label: "Defensive Right" },
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

  const saveEventRef = useRef<() => void>(() => {});
  const previousClipRef = useRef<() => void>(() => {});
  const nextClipRef = useRef<() => void>(() => {});
  const togglePlaybackRef = useRef<() => void>(() => {});

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

  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [selectedOutcome, setSelectedOutcome] = useState("");
  const [selectedZone, setSelectedZone] = useState("");

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

  const clipStart = currentClip
    ? numberValue(currentClip.start_seconds)
    : 0;

  const clipEnd = currentClip
    ? numberValue(currentClip.end_seconds)
    : 0;

  const clipDuration = Math.max(
    0,
    clipEnd - clipStart
  );

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
  }) {
    if (!options?.keepPlayer) {
      setSelectedPlayerId("");
    }

    setSelectedAction("");
    setSelectedOutcome("");
    setSelectedZone("");
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

      const response = await fetch(
        `/api/games/${gameId}`,
        {
          cache: "no-store",
        }
      );

      const json = await response.json();

      if (!response.ok || !json.ok) {
        throw new Error(
          json?.error || "Failed to load game."
        );
      }

      const loadedGame = json.data as GameRow;
      setGame(loadedGame);

      const [
        playersResult,
        clipsResult,
        eventsResult,
      ] = await Promise.all([
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
        throw new Error(
          playersResult.error.message
        );
      }

      if (clipsResult.error) {
        throw new Error(
          clipsResult.error.message
        );
      }

      if (eventsResult.error) {
        throw new Error(
          eventsResult.error.message
        );
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
          loadedClips.map(
            (clip) => clip.video_path
          )
        )
      );

      const loadedVideos: VideoFile[] = [];

      for (const path of paths) {
        const {
          data,
          error: signedError,
        } = await supabase.storage
          .from("match-videos")
          .createSignedUrl(
            path,
            60 * 60 * 6
          );

        if (
          signedError ||
          !data?.signedUrl
        ) {
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
      Math.min(
        clipEnd,
        video.currentTime + amount
      )
    );

    video.currentTime = next;
    setCurrentTime(next);
  }

  function goToClip(index: number) {
    if (
      index < 0 ||
      index >= sortedClips.length
    ) {
      return;
    }

    setCurrentClipIndex(index);

    /*
      Player resets whenever we move
      to another clip.
    */
    resetTagger();
    setError(null);
  }

  function previousClip() {
    if (currentClipIndex <= 0) return;

    goToClip(currentClipIndex - 1);
  }

  function nextClip() {
    if (
      currentClipIndex >=
      sortedClips.length - 1
    ) {
      return;
    }

    goToClip(currentClipIndex + 1);
  }

  async function adjustClipBoundary(
    boundary: "start" | "end",
    amount: number
  ) {
    if (!currentClip || savingTrim) {
      return;
    }

    let newStart = clipStart;
    let newEnd = clipEnd;

    if (boundary === "start") {
      newStart = Math.max(
        0,
        Number(
          (clipStart + amount).toFixed(3)
        )
      );
    } else {
      newEnd = Math.max(
        0,
        Number(
          (clipEnd + amount).toFixed(3)
        )
      );
    }

    if (newEnd - newStart < 0.5) {
      setError(
        "The clip must be at least 0.5 seconds long."
      );
      return;
    }

    setSavingTrim(true);
    setError(null);

    try {
      const supabase =
        supabaseBrowser();

      const {
        data,
        error: updateError,
      } = await supabase
        .from("clips")
        .update({
          start_seconds: newStart,
          end_seconds: newEnd,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", currentClip.id)
        .select(
          "id,game_id,created_by,video_path,start_seconds,end_seconds"
        )
        .single();

      if (updateError) {
        throw new Error(
          updateError.message
        );
      }

      const updatedClip =
        data as ClipRow;

      setClips((existing) =>
        existing.map((clip) =>
          clip.id === currentClip.id
            ? updatedClip
            : clip
        )
      );

      const video = videoRef.current;

      if (video) {
        const updatedStart =
          numberValue(
            updatedClip.start_seconds
          );

        video.currentTime =
          updatedStart;

        setCurrentTime(
          updatedStart
        );

        video.play().catch(() => {});
      }

      showNoticeMessage(
        "Clip updated"
      );
    } catch (e: any) {
      setError(
        e?.message ||
          "Failed to adjust clip."
      );
    } finally {
      setSavingTrim(false);
    }
  }

  async function saveEvent() {
    if (
      !currentClip ||
      !userId ||
      savingEvent
    ) {
      return;
    }

    if (!selectedPlayerId) {
      setError(
        "Choose a player or Team."
      );
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
      setError(
        "Choose a field location."
      );
      return;
    }

    setSavingEvent(true);
    setError(null);

    try {
      const supabase =
        supabaseBrowser();

      let eventSeconds =
        currentTime;

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
        notes:
          notes.trim() || null,
        updated_at:
          new Date().toISOString(),
      };

      if (editingEventId) {
        const {
          data,
          error: updateError,
        } = await supabase
          .from("clip_events")
          .update(payload)
          .eq(
            "id",
            editingEventId
          )
          .select("*")
          .single();

        if (updateError) {
          throw new Error(
            updateError.message
          );
        }

        setEvents((existing) =>
          existing.map((event) =>
            event.id ===
            editingEventId
              ? (data as ClipEventRow)
              : event
          )
        );

        showNoticeMessage(
          "Event updated"
        );
      } else {
        const {
          data,
          error: insertError,
        } = await supabase
          .from("clip_events")
          .insert(payload)
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

        showNoticeMessage(
          "Event added"
        );
      }

      /*
        Keep the player selected
        while working inside the
        same clip.
      */
      resetTagger({
        keepPlayer: true,
      });
    } catch (e: any) {
      setError(
        e?.message ||
          "Failed to save event."
      );
    } finally {
      setSavingEvent(false);
    }
  }

  function editEvent(
    event: ClipEventRow
  ) {
    setEditingEventId(event.id);

    setSelectedPlayerId(
      event.player_id ?? "team"
    );

    setSelectedAction(
      event.action
    );

    setSelectedOutcome(
      event.outcome ?? ""
    );

    setSelectedZone(
      event.field_zone ?? ""
    );

    setNotes(
      event.notes ?? ""
    );

    setShowNotes(
      Boolean(event.notes)
    );

    const video =
      videoRef.current;

    if (video) {
      const time =
        numberValue(
          event.event_seconds
        );

      video.currentTime = time;
      setCurrentTime(time);
      video.pause();
    }
  }

  function duplicateEvent(
    event: ClipEventRow
  ) {
    setEditingEventId(null);

    setSelectedPlayerId(
      event.player_id ?? "team"
    );

    setSelectedAction(
      event.action
    );

    setSelectedOutcome(
      event.outcome ?? ""
    );

    setSelectedZone(
      event.field_zone ?? ""
    );

    setNotes(
      event.notes ?? ""
    );

    setShowNotes(
      Boolean(event.notes)
    );

    const video =
      videoRef.current;

    if (video) {
      const time =
        numberValue(
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

  async function deleteEvent(
    eventId: string
  ) {
    const ok =
      window.confirm(
        "Delete this event?"
      );

    if (!ok) return;

    try {
      const supabase =
        supabaseBrowser();

      const {
        error: deleteError,
      } = await supabase
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
          (event) =>
            event.id !== eventId
        )
      );

      if (
        editingEventId === eventId
      ) {
        resetTagger();
      }

      showNoticeMessage(
        "Event deleted"
      );
    } catch (e: any) {
      setError(
        e?.message ||
          "Failed to delete event."
      );
    }
  }

  async function deleteCurrentClip() {
    if (!currentClip) return;

    const ok =
      window.confirm(
        "Delete this clip and all events attached to it?"
      );

    if (!ok) return;

    try {
      const supabase =
        supabaseBrowser();

      const {
        error: deleteError,
      } = await supabase
        .from("clips")
        .delete()
        .eq(
          "id",
          currentClip.id
        );

      if (deleteError) {
        throw new Error(
          deleteError.message
        );
      }

      const deletedId =
        currentClip.id;

      const remaining =
        clips.filter(
          (clip) =>
            clip.id !== deletedId
        );

      setClips(remaining);

      setEvents((existing) =>
        existing.filter(
          (event) =>
            event.clip_id !==
            deletedId
        )
      );

      setCurrentClipIndex(
        (index) =>
          Math.max(
            0,
            Math.min(
              index,
              remaining.length - 1
            )
          )
      );

      resetTagger();

      showNoticeMessage(
        "Clip deleted"
      );
    } catch (e: any) {
      setError(
        e?.message ||
          "Failed to delete clip."
      );
    }
  }

  function playerLabel(
    playerId: string | null
  ) {
    if (!playerId) {
      return "TEAM";
    }

    const player =
      players.find(
        (item) =>
          item.id === playerId
      );

    if (!player) {
      return "Player";
    }

    const jersey =
      player.jersey_number !==
        null &&
      player.jersey_number !==
        undefined
        ? `#${player.jersey_number} `
        : "";

    return `${jersey}${player.name}`;
  }

  function zoneLabel(
    zone: string | null
  ) {
    if (!zone) {
      return "No location";
    }

    return (
      FIELD_ZONES.find(
        (item) =>
          item.id === zone
      )?.label ?? zone
    );
  }

  useEffect(() => {
    setMounted(true);

    return () => {
      if (
        noticeTimerRef.current
      ) {
        clearTimeout(
          noticeTimerRef.current
        );
      }
    };
  }, []);

  useEffect(() => {
    if (
      !mounted ||
      !gameId
    ) {
      return;
    }

    loadWorkspace();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, gameId]);

  useEffect(() => {
    if (
      !currentClip ||
      !currentVideo
    ) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        const video =
          videoRef.current;

        if (!video) return;

        const start =
          numberValue(
            currentClip.start_seconds
          );

        video.currentTime =
          start;

        setCurrentTime(start);

        video
          .play()
          .catch(() => {});
      }, 120);

    return () =>
      window.clearTimeout(
        timer
      );
  }, [
    currentClip?.id,
    currentVideo?.signedUrl,
  ]);

  saveEventRef.current =
    saveEvent;

  previousClipRef.current =
    previousClip;

  nextClipRef.current =
    nextClip;

  togglePlaybackRef.current =
    togglePlayback;

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

      if (event.repeat) {
        return;
      }

      if (
        event.code ===
          "ShiftLeft" ||
        event.code ===
          "ShiftRight"
      ) {
        event.preventDefault();

        togglePlaybackRef.current();
        return;
      }

      if (
        event.code ===
        "ArrowLeft"
      ) {
        event.preventDefault();

        previousClipRef.current();
        return;
      }

      if (
        event.code ===
        "ArrowRight"
      ) {
        event.preventDefault();

        nextClipRef.current();
        return;
      }

      if (
        event.code === "Space"
      ) {
        event.preventDefault();

        saveEventRef.current();
        return;
      }

      const key =
        event.key.toLowerCase();

      const actionByKey: Record<
        string,
        string
      > = {
        p: "Pass",
        c: "Carry 10+ yd",
        t: "Take-on",
        s: "Shot",
        g: "Goal",
        a: "Assist",
        w: "Possession Won",
        r: "Pressure",
      };

      if (
        actionByKey[key]
      ) {
        event.preventDefault();

        setSelectedAction(
          actionByKey[key]
        );

        return;
      }

      if (key === "y") {
        event.preventDefault();

        setSelectedOutcome(
          "successful"
        );

        return;
      }

      if (key === "n") {
        event.preventDefault();

        setSelectedOutcome(
          "unsuccessful"
        );
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
          onClick={() =>
            router.back()
          }
        >
          Go Back
        </button>
      </div>
    );
  }

  if (
    sortedClips.length === 0
  ) {
    return (
      <div className="space-y-5">
        <h1 className="text-3xl font-bold">
          Tag Clips
        </h1>

        <div className="card py-10 text-center">
          <div className="text-xl font-semibold">
            No clips yet
          </div>

          <p className="mt-2 text-sm text-zinc-400">
            Create clips first,
            then tag the events
            inside them.
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
    <div className="mx-auto w-full max-w-[1800px] space-y-3 pb-6">
      {notice ? (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-yellow-400 px-4 py-3 font-bold text-black shadow-2xl">
          ✓ {notice}
        </div>
      ) : null}

      {/* TOP WORKSPACE BAR */}
      <div className="card py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-yellow-400">
              InsightFC Analysis Workspace
            </div>

            <div className="font-bold">
              {game.date} • vs{" "}
              {game.opponent ??
                "Opponent"}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="mr-2 hidden text-xs text-zinc-500 lg:block">
              ← → Clips • Shift Play/Pause • Space Add Event
            </div>

            <button
              className="btn-ghost"
              onClick={() =>
                router.push(
                  `/teams/${game.team_id}`
                )
              }
            >
              Team Hub
            </button>

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
        </div>
      </div>

      {error ? (
        <div className="card border-red-700 py-3 text-red-300">
          {error}
        </div>
      ) : null}

      {/* MAIN WORKSPACE */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[300px_minmax(0,1fr)] 2xl:grid-cols-[320px_minmax(0,1fr)]">
        {/* LEFT TAGGING CONTROL CENTER */}
        <aside className="xl:sticky xl:top-4 xl:self-start">
          <div className="card space-y-3 border-yellow-500/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-yellow-400">
                  Tagging Control Center
                </div>

                <div className="text-sm font-bold">
                  Clip{" "}
                  {currentClipIndex + 1} /{" "}
                  {sortedClips.length}
                </div>
              </div>

              <div className="rounded-lg bg-yellow-400 px-2 py-1 text-[11px] font-black text-black">
                {currentClipEvents.length} saved
              </div>
            </div>

            {/* PLAYER */}
            <div>
              <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                1. Player — Mouse
              </div>

              <div className="grid max-h-[132px] grid-cols-2 gap-1.5 overflow-y-auto pr-1">
                <button
                  type="button"
                  className={
                    selectedPlayerId ===
                    "team"
                      ? "btn-primary text-xs"
                      : "btn-ghost text-xs"
                  }
                  onClick={() =>
                    setSelectedPlayerId(
                      "team"
                    )
                  }
                >
                  TEAM
                </button>

                {players.map(
                  (player) => (
                    <button
                      key={player.id}
                      type="button"
                      title={
                        player.name
                      }
                      className={
                        selectedPlayerId ===
                        player.id
                          ? "btn-primary truncate text-xs"
                          : "btn-ghost truncate text-xs"
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
                  )
                )}
              </div>
            </div>

            {/* ACTION */}
            <div>
              <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                2. Action
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {ACTIONS.map(
                  (action) => (
                    <button
                      key={
                        action.label
                      }
                      type="button"
                      className={
                        selectedAction ===
                        action.label
                          ? "btn-primary flex items-center justify-between gap-2 text-[11px]"
                          : "btn-ghost flex items-center justify-between gap-2 text-[11px]"
                      }
                      onClick={() =>
                        setSelectedAction(
                          action.label
                        )
                      }
                    >
                      <span>
                        {action.label}
                      </span>

                      <span className="rounded border border-current/30 px-1.5 py-0.5 text-[9px] opacity-70">
                        (
                        {action.key}
                        )
                      </span>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* OUTCOME */}
            <div>
              <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                3. Outcome
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  className={
                    selectedOutcome ===
                    "successful"
                      ? "btn-primary text-[11px]"
                      : "btn-ghost text-[11px]"
                  }
                  onClick={() =>
                    setSelectedOutcome(
                      "successful"
                    )
                  }
                >
                  ✓ Success (Y)
                </button>

                <button
                  type="button"
                  className={
                    selectedOutcome ===
                    "unsuccessful"
                      ? "btn-primary text-[11px]"
                      : "btn-ghost text-[11px]"
                  }
                  onClick={() =>
                    setSelectedOutcome(
                      "unsuccessful"
                    )
                  }
                >
                  ✕ Fail (N)
                </button>
              </div>
            </div>

            {/* SMALL PITCH */}
            <div>
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                4. Location
              </div>

              <div className="mb-1 text-center text-[9px] font-bold tracking-[0.14em] text-yellow-400">
                ↑ ATTACKING
              </div>

              <div className="relative mx-auto aspect-[0.72/1] w-[125px] overflow-hidden rounded-lg border border-white/50 bg-emerald-900/30">
                <div className="pointer-events-none absolute left-0 right-0 top-1/2 z-20 border-t border-white/35" />

                <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/35" />

                <div className="pointer-events-none absolute left-1/2 top-0 z-20 h-[14%] w-[55%] -translate-x-1/2 border border-t-0 border-white/30" />

                <div className="pointer-events-none absolute bottom-0 left-1/2 z-20 h-[14%] w-[55%] -translate-x-1/2 border border-b-0 border-white/30" />

                <div className="absolute inset-0 z-10 grid grid-cols-3 grid-rows-3">
                  {FIELD_ZONES.map(
                    (zone) => (
                      <button
                        key={zone.id}
                        type="button"
                        title={
                          zone.label
                        }
                        className={`border border-white/20 text-[9px] font-black ${
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

              <div className="mt-1 text-center text-[9px] font-bold tracking-[0.14em] text-zinc-500">
                ↓ DEFENDING
              </div>

              <div className="mt-1 truncate text-center text-[10px] text-zinc-400">
                {selectedZone
                  ? zoneLabel(
                      selectedZone
                    )
                  : "Select field zone"}
              </div>
            </div>

            {/* CURRENT EVENT */}
            <div className="rounded-xl border border-zinc-800 bg-black/25 p-2">
              <div className="text-[9px] text-zinc-500">
                CURRENT EVENT
              </div>

              <div className="mt-1 truncate text-xs font-semibold">
                {selectedPlayerId
                  ? selectedPlayerId ===
                    "team"
                    ? "TEAM"
                    : playerLabel(
                        selectedPlayerId
                      )
                  : "Choose player"}
              </div>

              <div className="mt-1 truncate text-[10px] text-zinc-400">
                {selectedAction ||
                  "Action"}
                {" • "}
                {selectedOutcome
                  ? selectedOutcome ===
                    "successful"
                    ? "Success"
                    : "Fail"
                  : "Outcome"}
                {" • "}
                {selectedZone
                  ? zoneLabel(
                      selectedZone
                    )
                  : "Location"}
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
                : "Add Event — SPACE"}
            </button>

            {editingEventId ? (
              <button
                className="btn-ghost w-full text-xs"
                onClick={() =>
                  resetTagger()
                }
              >
                Cancel Edit
              </button>
            ) : null}

            <button
              className="btn-ghost w-full text-[11px]"
              onClick={() =>
                setShowNotes(
                  (value) =>
                    !value
                )
              }
            >
              {showNotes
                ? "Hide Note"
                : "+ Optional Note"}
            </button>

            {showNotes ? (
              <textarea
                className="input min-h-14 w-full text-xs"
                value={notes}
                onChange={(
                  event
                ) =>
                  setNotes(
                    event.target
                      .value
                  )
                }
                placeholder="Coaching note…"
              />
            ) : null}
          </div>
        </aside>

        {/* RIGHT WORKSPACE */}
        <main className="min-w-0 space-y-3">
          {/* CLIP NAV */}
          <div className="card py-2">
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
              <button
                className="btn-ghost"
                disabled={
                  currentClipIndex ===
                  0
                }
                onClick={
                  previousClip
                }
              >
                ← Previous
              </button>

              <div className="text-center">
                <div className="text-sm font-bold">
                  Clip{" "}
                  {currentClipIndex +
                    1}{" "}
                  of{" "}
                  {
                    sortedClips.length
                  }
                </div>

                <div className="text-[11px] text-zinc-500">
                  {formatTime(
                    clipStart
                  )}{" "}
                  →{" "}
                  {formatTime(
                    clipEnd
                  )}
                  {" • "}
                  {clipDuration.toFixed(
                    1
                  )}
                  s
                  {" • "}
                  {
                    currentClipEvents.length
                  }{" "}
                  events
                </div>
              </div>

              <button
                className="btn-primary"
                disabled={
                  currentClipIndex ===
                  sortedClips.length -
                    1
                }
                onClick={nextClip}
              >
                Next →
              </button>
            </div>
          </div>

          {/* LARGE VIDEO */}
          <div className="card p-2">
            {currentVideo ? (
              <video
                key={
                  currentVideo.signedUrl
                }
                ref={videoRef}
                src={
                  currentVideo.signedUrl
                }
                controls
                playsInline
                preload="metadata"
                className="mx-auto w-full rounded-xl bg-black object-contain xl:max-h-[66vh] 2xl:max-h-[70vh]"
                onLoadedMetadata={() => {
                  const video =
                    videoRef.current;

                  if (!video) {
                    return;
                  }

                  video.currentTime =
                    clipStart;

                  setCurrentTime(
                    clipStart
                  );

                  video
                    .play()
                    .catch(() => {});
                }}
                onTimeUpdate={
                  handleTimeUpdate
                }
              />
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-xl bg-black text-zinc-400">
                Video unavailable
              </div>
            )}

            {/* PLAYBACK STRIP */}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-black/25 p-2">
              <div>
                <div className="text-[9px] text-zinc-500">
                  EVENT TIME
                </div>

                <div className="font-mono font-bold text-yellow-300">
                  {formatTime(
                    currentTime
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <button
                  className="btn-ghost"
                  onClick={() =>
                    movePlayhead(
                      -0.5
                    )
                  }
                >
                  −0.5
                </button>

                <button
                  className="btn-ghost"
                  onClick={
                    togglePlayback
                  }
                >
                  Play / Pause
                </button>

                <button
                  className="btn-ghost"
                  onClick={() =>
                    movePlayhead(
                      0.5
                    )
                  }
                >
                  +0.5
                </button>

                <button
                  className="btn-ghost"
                  onClick={
                    restartClip
                  }
                >
                  Restart
                </button>
              </div>

              <div className="text-[10px] text-zinc-500">
                Shift = Play /
                Pause
              </div>
            </div>
          </div>

          {/* LIVE TRIM */}
          <div className="card py-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-yellow-400">
                  Live Trim
                </span>

                <span className="ml-2 text-xs text-zinc-500">
                  {clipDuration.toFixed(
                    1
                  )}{" "}
                  sec
                </span>
              </div>

              <div className="text-[10px] text-zinc-500">
                {savingTrim
                  ? "Saving…"
                  : "Auto-saves"}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
              <div className="rounded-xl border border-zinc-800 p-2">
                <div className="mb-1 text-[10px] text-zinc-500">
                  START{" "}
                  <span className="font-mono font-bold text-yellow-300">
                    {formatTime(
                      clipStart
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-6 gap-1">
                  {TRIM_AMOUNTS.map(
                    (amount) => (
                      <button
                        key={`start-${amount}`}
                        className="btn-ghost px-1 py-1.5 text-[10px]"
                        disabled={
                          savingTrim
                        }
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
              </div>

              <div className="rounded-xl border border-zinc-800 p-2">
                <div className="mb-1 text-[10px] text-zinc-500">
                  END{" "}
                  <span className="font-mono font-bold text-yellow-300">
                    {formatTime(
                      clipEnd
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-6 gap-1">
                  {TRIM_AMOUNTS.map(
                    (amount) => (
                      <button
                        key={`end-${amount}`}
                        className="btn-ghost px-1 py-1.5 text-[10px]"
                        disabled={
                          savingTrim
                        }
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
              </div>
            </div>
          </div>

          {/* SAVED EVENTS */}
          <div className="card space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold">
                  Saved Events
                </div>

                <div className="text-[11px] text-zinc-500">
                  Already saved to
                  InsightFC
                </div>
              </div>

              <div className="rounded-lg bg-yellow-400 px-2.5 py-1 text-sm font-black text-black">
                {
                  currentClipEvents.length
                }
              </div>
            </div>

            {currentClipEvents.length ===
            0 ? (
              <div className="rounded-xl border border-dashed border-zinc-700 p-3 text-center text-xs text-zinc-500">
                No events tagged in
                this clip yet.
              </div>
            ) : (
              <div className="space-y-1.5">
                {currentClipEvents.map(
                  (event) => (
                    <div
                      key={
                        event.id
                      }
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-black/25 px-3 py-2"
                    >
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
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
                          {
                            event.action
                          }
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
                            : "✕"}
                        </span>

                        <span className="text-zinc-500">
                          {zoneLabel(
                            event.field_zone
                          )}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        <button
                          className="btn-ghost text-xs"
                          onClick={() => {
                            const video =
                              videoRef.current;

                            if (
                              !video
                            ) {
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
                          className="btn-ghost text-xs"
                          onClick={() =>
                            duplicateEvent(
                              event
                            )
                          }
                        >
                          Duplicate
                        </button>

                        <button
                          className="btn-ghost text-xs"
                          onClick={() =>
                            editEvent(
                              event
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="btn-danger text-xs"
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

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800 pt-3">
              <button
                className="btn-danger text-xs"
                onClick={
                  deleteCurrentClip
                }
              >
                Delete Clip
              </button>

              <div className="flex gap-2">
                <button
                  className="btn-ghost"
                  disabled={
                    currentClipIndex ===
                    0
                  }
                  onClick={
                    previousClip
                  }
                >
                  ← Previous
                </button>

                <button
                  className="btn-primary"
                  disabled={
                    currentClipIndex ===
                    sortedClips.length -
                      1
                  }
                  onClick={
                    nextClip
                  }
                >
                  Next Clip →
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
