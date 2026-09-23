"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ProcessingMatch = {
  matchId: string;
  team: string;
  opponent: string;
  matchDate: string;
  environment: string;
  matchType: string;
  location: string;
  halfLength: number;
  gameSize: number;
  lineup: {
    id: number;
    name: string;
    number: number;
    position: string;
    x: number;
    y: number;
  }[];
  videos: {
    name: string;
    path: string;
    half: "First Half" | "Second Half";
    size: number;
    type: string;
  }[];
};

const futureSteps = [
  "Preparing video",
  "Identifying players",
  "Tracking the ball",
  "Detecting actions",
  "Building player reports",
];

export default function ProcessingPage() {
  const router = useRouter();

  const [match, setMatch] = useState<ProcessingMatch | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const savedMatch = sessionStorage.getItem(
      "insightfc-processing-match"
    );

    if (savedMatch) {
      try {
        setMatch(JSON.parse(savedMatch));
      } catch {
        setMatch(null);
      }
    }

    setLoaded(true);
  }, []);

  if (!loaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="text-sm font-semibold text-zinc-400">
          Loading match…
        </div>
      </main>
    );
  }

  if (!match) {
    return (
      <main className="min-h-screen bg-[#050505] text-white">
        <div className="mx-auto max-w-3xl px-5 py-16 md:px-8">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center">
            <div className="text-sm font-bold uppercase tracking-[0.22em] text-yellow-400">
              InsightFC
            </div>

            <h1 className="mt-4 text-3xl font-black">
              No match is processing
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-400">
              Upload a match first and InsightFC will bring you here
              after the videos are securely stored.
            </p>

            <button
              type="button"
              onClick={() => router.push("/upload")}
              className="mt-6 rounded-xl bg-yellow-400 px-6 py-3 text-sm font-black text-black hover:bg-yellow-300"
            >
              Upload a Match
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-4xl px-5 py-10 md:px-8 md:py-16">
        <div className="mb-10">
          <div className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-yellow-400">
            InsightFC
          </div>

          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1.5 text-xs font-bold text-yellow-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
            MATCH PROCESSING
          </div>

          <h1 className="text-3xl font-black tracking-tight md:text-5xl">
            Analyzing {match.team} vs {match.opponent}
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
            Your original match footage has been uploaded securely.
            InsightFC is preparing this match for player actions,
            timestamps, clips, and reports.
          </p>
        </div>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 md:p-7">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-6">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
                Match
              </div>

              <div className="mt-1 text-lg font-black">
                {match.team} vs {match.opponent}
              </div>

              <div className="mt-1 text-sm text-zinc-500">
                {match.matchDate} • {match.location}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-right">
              <div className="text-sm font-bold">
                {match.gameSize}v{match.gameSize}
              </div>

              <div className="mt-1 text-xs text-zinc-500">
                2 × {match.halfLength} min • {match.environment}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <StatusRow
              state="complete"
              title="Match created"
              description="Match details and starting lineup received."
            />

            <StatusRow
              state="complete"
              title="Videos uploaded"
              description={`${match.videos.length} video ${
                match.videos.length === 1 ? "file" : "files"
              } stored securely.`}
            />

            {futureSteps.map((step, index) => (
              <StatusRow
                key={step}
                state={index === 0 ? "waiting" : "future"}
                title={step}
                description={
                  index === 0
                    ? "Ready for the InsightFC analysis pipeline."
                    : "Waiting for the previous step."
                }
              />
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
              Match Footage
            </div>

            <div className="mt-3 text-3xl font-black">
              {match.videos.length}
            </div>

            <div className="mt-1 text-sm text-zinc-400">
              {match.videos.length === 1
                ? "video uploaded"
                : "videos uploaded"}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
              Starting Lineup
            </div>

            <div className="mt-3 text-3xl font-black">
              {match.lineup.length}
            </div>

            <div className="mt-1 text-sm text-zinc-400">
              players supplied for identification
            </div>
          </div>
        </section>

        <div className="mt-6 rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-5">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-400 font-black text-black">
              i
            </div>

            <div>
              <div className="font-bold">
                Your upload is complete.
              </div>

              <p className="mt-1 text-sm leading-6 text-zinc-400">
                The footage is safely stored. The next engineering
                step is connecting InsightFC&apos;s actual video
                analysis pipeline. This screen does not pretend that
                player tracking or action detection has happened
                before those systems are connected.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-xl bg-yellow-400 px-6 py-3 text-sm font-black text-black hover:bg-yellow-300"
          >
            Return to Dashboard
          </button>

          <button
            type="button"
            onClick={() => router.push("/upload")}
            className="rounded-xl border border-zinc-700 bg-zinc-950 px-6 py-3 text-sm font-bold text-zinc-300 hover:border-zinc-500 hover:text-white"
          >
            Upload Another Match
          </button>
        </div>
      </div>
    </main>
  );
}

function StatusRow({
  state,
  title,
  description,
}: {
  state: "complete" | "waiting" | "future";
  title: string;
  description: string;
}) {
  return (
    <div
      className={`flex items-center gap-4 rounded-xl border p-4 ${
        state === "complete"
          ? "border-green-500/20 bg-green-500/5"
          : state === "waiting"
          ? "border-yellow-400/30 bg-yellow-400/5"
          : "border-zinc-800 bg-black"
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${
          state === "complete"
            ? "bg-green-500 text-black"
            : state === "waiting"
            ? "bg-yellow-400 text-black"
            : "border border-zinc-700 bg-zinc-900 text-zinc-600"
        }`}
      >
        {state === "complete" ? (
          "✓"
        ) : state === "waiting" ? (
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-black" />
        ) : (
          "○"
        )}
      </div>

      <div>
        <div
          className={`text-sm font-bold ${
            state === "future"
              ? "text-zinc-500"
              : "text-white"
          }`}
        >
          {title}
        </div>

        <div className="mt-1 text-xs text-zinc-500">
          {description}
        </div>
      </div>
    </div>
  );
}
