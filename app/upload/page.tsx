"use client";

import { useMemo, useState } from "react";

type VideoPart = {
  id: string;
  file: File;
  half: "First Half" | "Second Half";
};

export default function UploadMatchPage() {
  const [opponent, setOpponent] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [environment, setEnvironment] = useState("Outdoor");
  const [matchType, setMatchType] = useState("League");
  const [location, setLocation] = useState("");
  const [halfLength, setHalfLength] = useState("30");
  const [videos, setVideos] = useState<VideoPart[]>([]);
  const [message, setMessage] = useState("");

  const totalSize = useMemo(() => {
    return videos.reduce((sum, video) => sum + video.file.size, 0);
  }, [videos]);

  function formatSize(bytes: number) {
    if (!bytes) return "0 GB";
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;

    const incoming = Array.from(files);

    if (videos.length + incoming.length > 4) {
      setMessage("A match can contain up to 4 video files.");
      return;
    }

    const nextVideos: VideoPart[] = incoming.map((file, index) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${index}`,
      file,
      half:
        videos.length + index < 2
          ? "First Half"
          : "Second Half",
    }));

    setVideos((current) => [...current, ...nextVideos]);
    setMessage("");
  }

  function removeVideo(id: string) {
    setVideos((current) =>
      current.filter((video) => video.id !== id)
    );
    setMessage("");
  }

  function changeHalf(
    id: string,
    half: "First Half" | "Second Half"
  ) {
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
      setMessage("Enter the opponent before processing the match.");
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
            Add the match details and upload the original game videos.
            InsightFC will treat multiple recordings as one continuous match.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 md:p-6">
            <div className="mb-6">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                Step 1
              </div>
              <h2 className="mt-1 text-xl font-bold">
                Match Details
              </h2>
            </div>

            <div className="space-y-5">
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
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-yellow-400"
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
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-yellow-400"
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
                      className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                        environment === option
                          ? "border-yellow-400 bg-yellow-400 text-black"
                          : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-600"
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
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-yellow-400"
                >
                  <option value="League">League</option>
                  <option value="Tournament">Tournament</option>
                  <option value="Scrimmage">Scrimmage</option>
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
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-yellow-400"
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
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-yellow-400"
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

          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 md:p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                  Step 2
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
                <div className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
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
                          {(
                            video.file.size /
                            1024 /
                            1024
                          ).toFixed(0)}{" "}
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
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <select
                          value={video.half}
                          onChange={(event) =>
                            changeHalf(
                              video.id,
                              event.target.value as
                                | "First Half"
                                | "Second Half"
                            )
                          }
                          className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-xs font-semibold outline-none focus:border-yellow-400"
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
              <div className="text-sm font-semibold text-zinc-200">
                One video or multiple files — both work.
              </div>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                If your camera creates multiple recordings, InsightFC is
                designed to treat them as one match, including small gaps
                between files.
              </p>
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 md:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                Step 3
              </div>
              <h2 className="mt-1 text-xl font-bold">
                Process Match
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-zinc-400">
                InsightFC will process the match into player actions,
                stats, timestamps, and video clips.
              </p>
            </div>

            <button
              type="button"
              onClick={processMatch}
              className="shrink-0 rounded-xl bg-yellow-400 px-7 py-3.5 text-sm font-black text-black transition hover:bg-yellow-300"
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
