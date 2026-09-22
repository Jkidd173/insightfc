"use client";

import { useState } from "react";

const players = [
  {
    number: 10,
    name: "Eli Carter",
    pos: "CM",
    touches: 58,
    passes: "31/38",
    carries: 6,
    takeons: "4/6",
    shots: 2,
    goals: 1,
    assists: 1,
    won: 7,
    pressures: 12,
  },
  {
    number: 7,
    name: "Noah Brooks",
    pos: "RW",
    touches: 46,
    passes: "18/23",
    carries: 8,
    takeons: "6/9",
    shots: 4,
    goals: 2,
    assists: 0,
    won: 3,
    pressures: 9,
  },
  {
    number: 8,
    name: "Liam Reed",
    pos: "CM",
    touches: 52,
    passes: "29/35",
    carries: 5,
    takeons: "2/3",
    shots: 1,
    goals: 0,
    assists: 1,
    won: 8,
    pressures: 14,
  },
  {
    number: 4,
    name: "Mason Lee",
    pos: "CB",
    touches: 41,
    passes: "25/30",
    carries: 2,
    takeons: "0/1",
    shots: 0,
    goals: 0,
    assists: 0,
    won: 11,
    pressures: 7,
  },
];

type Player = (typeof players)[number];

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <button
      type="button"
      className="rounded-xl border border-white/10 bg-black/40 p-4 text-left transition hover:border-yellow-400/60 hover:bg-black/60"
    >
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-zinc-500">
        {label}
      </div>
    </button>
  );
}

function StatSection({
  title,
  subtitle,
  stats,
}: {
  title: string;
  subtitle: string;
  stats: { label: string; value: string | number }[];
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-yellow-400">
          {title}
        </h3>
        <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
          />
        ))}
      </div>
    </section>
  );
}

export default function DemoPage() {
  const [selected, setSelected] = useState<Player>(players[0]);

  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      <div className="bg-yellow-400 px-4 py-2 text-center text-xs font-bold uppercase tracking-widest text-black">
        Demo Data — InsightFC Testing Environment
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">
            InsightFC Coach Dashboard
          </p>

          <h1 className="mt-2 text-4xl font-bold">Northside U10</h1>

          <p className="mt-2 text-sm text-zinc-500">
            Demo team • Player development and match analysis
          </p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            ["12", "Players"],
            ["6", "Games Analyzed"],
            ["14", "Goals"],
            ["438", "Verified Actions"],
          ].map(([value, label]) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-zinc-900 p-5"
            >
              <div className="text-3xl font-bold">{value}</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-zinc-500">
                {label}
              </div>
            </div>
          ))}
        </div>

        <section className="mb-8 rounded-2xl border border-white/10 bg-zinc-900 p-6">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-yellow-400">
                Latest Match
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Northside U10 4–2 Riverside U10
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                Match analysis verified
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["78%", "Pass Completion"],
                ["17", "Take-ons Won"],
                ["33", "Possession Won"],
                ["46", "Pressures"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-xl bg-black/40 px-4 py-3"
                >
                  <div className="font-bold">{value}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-wider text-zinc-500">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-8">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-400">
              Players
            </p>
            <h2 className="mt-1 text-xl font-bold">
              Select a player to review
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {players.map((player) => {
              const active = selected.number === player.number;

              return (
                <button
                  key={player.number}
                  type="button"
                  onClick={() => setSelected(player)}
                  className={`rounded-2xl border p-5 text-left transition ${
                    active
                      ? "border-yellow-400 bg-yellow-400/10"
                      : "border-white/10 bg-zinc-900 hover:border-white/25"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-2xl font-black ${
                        active ? "text-yellow-400" : "text-zinc-500"
                      }`}
                    >
                      #{player.number}
                    </span>

                    <span className="rounded-full bg-black/50 px-3 py-1 text-xs text-zinc-400">
                      {player.pos}
                    </span>
                  </div>

                  <div className="mt-4 font-bold">{player.name}</div>
                  <div className="mt-1 text-xs text-zinc-500">U10</div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-white/10 bg-zinc-900 p-6">
          <div className="mb-6 border-b border-white/10 pb-5">
            <p className="text-xs font-bold uppercase tracking-wider text-yellow-400">
              Player Match Report
            </p>

            <h2 className="mt-2 text-2xl font-bold">{selected.name}</h2>

            <p className="mt-2 text-sm text-zinc-500">
              Latest match vs Riverside U10
            </p>
          </div>

          <div className="space-y-5">
            <StatSection
              title="In Possession"
              subtitle="How the player used and progressed the ball"
              stats={[
                { label: "Touches", value: selected.touches },
                { label: "Passes", value: selected.passes },
                { label: "Carries 10+ yd", value: selected.carries },
                { label: "Take-ons", value: selected.takeons },
              ]}
            />

            <StatSection
              title="Attacking"
              subtitle="Actions that directly contributed to creating or finishing chances"
              stats={[
                { label: "Shots", value: selected.shots },
                { label: "Goals", value: selected.goals },
                { label: "Assists", value: selected.assists },
              ]}
            />

            <StatSection
              title="Defending"
              subtitle="Actions showing defensive involvement and work without the ball"
              stats={[
                { label: "Possession Won", value: selected.won },
                { label: "Pressures", value: selected.pressures },
              ]}
            />
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <div className="group rounded-2xl border border-white/10 bg-zinc-900 p-6">
            <div className="mb-8 flex h-36 items-center justify-center rounded-xl bg-black/50">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 text-lg font-black text-black">
                  ▶
                </div>
                <p className="mt-3 text-xs text-zinc-500">
                  Video preview
                </p>
              </div>
            </div>

            <p className="text-xs font-bold uppercase tracking-wider text-yellow-400">
              Match Highlights
            </p>
            <h3 className="mt-2 text-xl font-bold">Team Highlight Reel</h3>
            <p className="mt-2 text-sm text-zinc-500">
              Review key attacking and defensive moments from the match.
            </p>
          </div>

          <div className="group rounded-2xl border border-white/10 bg-zinc-900 p-6">
            <div className="mb-8 flex h-36 items-center justify-center rounded-xl bg-black/50">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 text-lg font-black text-black">
                  ▶
                </div>
                <p className="mt-3 text-xs text-zinc-500">
                  Video preview
                </p>
              </div>
            </div>

            <p className="text-xs font-bold uppercase tracking-wider text-yellow-400">
              Player Highlights
            </p>
            <h3 className="mt-2 text-xl font-bold">
              {selected.name} Highlights
            </h3>
            <p className="mt-2 text-sm text-zinc-500">
              Watch selected moments from this player&apos;s match.
            </p>
          </div>
        </section>

        <div className="mt-5 rounded-2xl border border-white/10 bg-zinc-900 p-5 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-yellow-400">
            Full Match
          </p>
          <p className="mt-2 font-bold">Watch Full Match</p>
          <p className="mt-1 text-xs text-zinc-500">
            Review the complete match video and surrounding context.
          </p>
        </div>
      </div>
    </main>
  );
}
