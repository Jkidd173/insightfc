"use client";

import { useState } from "react";

const players = [
  { number: 10, name: "Eli Carter", pos: "CM", touches: 58, passes: "31/38", carries: 6, takeons: "4/6", shots: 2, goals: 1, assists: 1, won: 7, pressures: 12 },
  { number: 7, name: "Noah Brooks", pos: "RW", touches: 46, passes: "18/23", carries: 8, takeons: "6/9", shots: 4, goals: 2, assists: 0, won: 3, pressures: 8 },
  { number: 8, name: "Liam Reed", pos: "CM", touches: 52, passes: "29/35", carries: 5, takeons: "2/3", shots: 1, goals: 0, assists: 1, won: 8, pressures: 14 },
  { number: 4, name: "Mason Lee", pos: "CB", touches: 41, passes: "25/30", carries: 2, takeons: "0/1", shots: 0, goals: 0, assists: 0, won: 11, pressures: 7 },
];

export default function DemoPage() {
  const [selected, setSelected] = useState(players[0]);

  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      <div className="bg-yellow-400 px-4 py-2 text-center text-xs font-bold text-black">
        DEMO DATA — InsightFC Testing Environment
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">

        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-yellow-400">
            InsightFC Coach Dashboard
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Northside U10
          </h1>

          <p className="mt-2 text-zinc-400">
            Demo team • Player development and match analysis
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Players", "12"],
            ["Games Analyzed", "6"],
            ["Goals", "14"],
            ["Verified Actions", "438"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
            >
              <div className="text-3xl font-bold">{value}</div>
              <div className="mt-1 text-sm text-zinc-500">{label}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-yellow-400">
            Latest Match
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            Northside U10 4–2 Riverside U10
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Match analysis verified
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            {[
              ["Pass Completion", "78%"],
              ["Take-ons Won", "17"],
              ["Possession Won", "33"],
              ["Pressures", "46"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl bg-black/40 p-4"
              >
                <div className="text-xl font-bold">{value}</div>
                <div className="mt-1 text-xs text-zinc-500">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold">Players</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {players.map((player) => (
              <button
                key={player.number}
                onClick={() => setSelected(player)}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-left hover:border-yellow-400"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 font-black text-black">
                    {player.number}
                  </div>

                  <div>
                    <div className="font-bold">{player.name}</div>
                    <div className="text-xs text-zinc-500">
                      {player.pos} • U10
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-yellow-400/30 bg-zinc-900 p-6">

          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400 text-xl font-black text-black">
              {selected.number}
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-yellow-400">
                Player Match Report
              </p>

              <h2 className="text-2xl font-bold">
                {selected.name}
              </h2>

              <p className="text-sm text-zinc-500">
                Latest match vs Riverside U10
              </p>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">

            {[
              ["Touches", selected.touches],
              ["Passes", selected.passes],
              ["Carries 10+ yd", selected.carries],
              ["Take-ons", selected.takeons],
              ["Shots", selected.shots],
              ["Goals", selected.goals],
              ["Assists", selected.assists],
              ["Possession Won", selected.won],
              ["Pressures", selected.pressures],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl bg-black/40 p-4"
              >
                <div className="text-xl font-bold">{value}</div>
                <div className="mt-1 text-xs text-zinc-500">{label}</div>
              </div>
            ))}

          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-xl font-bold">
              Match Highlights
            </h2>

            <div className="mt-4 flex aspect-video items-center justify-center rounded-xl bg-black text-zinc-600">
              ▶ Team Highlight Reel
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-xl font-bold">
              Player Highlights
            </h2>

            <div className="mt-4 flex aspect-video items-center justify-center rounded-xl bg-black text-zinc-600">
              ▶ {selected.name} Highlights
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
