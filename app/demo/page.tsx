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

type Action = {
  time: string;
  result?: "Successful" | "Unsuccessful";
  detail: string;
};

const actionExamples: Record<string, Action[]> = {
  Touches: [
    { time: "02:14", detail: "First touch under pressure" },
    { time: "04:31", detail: "Receives in central midfield" },
    { time: "06:08", detail: "Controls and turns forward" },
    { time: "08:42", detail: "Receives between opponents" },
    { time: "11:19", detail: "First-time control into space" },
    { time: "14:18", detail: "Receives near right channel" },
  ],

  Passes: [
    { time: "03:06", result: "Successful", detail: "Forward pass into midfield" },
    { time: "05:44", result: "Successful", detail: "Short combination pass" },
    { time: "09:12", result: "Unsuccessful", detail: "Attempted through ball" },
    { time: "13:37", result: "Successful", detail: "Switches play to the right" },
    { time: "18:02", result: "Successful", detail: "Pass into attacking third" },
    { time: "24:16", result: "Unsuccessful", detail: "Forward pass intercepted" },
  ],

  "Carries 10+ yd": [
    { time: "06:08", result: "Successful", detail: "Carries forward through midfield" },
    { time: "12:51", result: "Successful", detail: "Progressive carry into space" },
    { time: "18:33", result: "Successful", detail: "Carries into attacking third" },
    { time: "25:20", result: "Successful", detail: "Breaks pressure with the ball" },
    { time: "31:07", result: "Successful", detail: "Carries down central channel" },
    { time: "38:14", result: "Successful", detail: "Advances possession 10+ yards" },
  ],

  "Take-ons": [
    { time: "08:42", result: "Successful", detail: "Beats defender in central midfield" },
    { time: "14:18", result: "Unsuccessful", detail: "Defender wins challenge near touchline" },
    { time: "21:07", result: "Successful", detail: "Gets past first defender on the dribble" },
    { time: "29:33", result: "Successful", detail: "Changes direction and beats opponent" },
    { time: "36:11", result: "Unsuccessful", detail: "Dribble stopped outside attacking third" },
    { time: "43:26", result: "Successful", detail: "Beats defender before entering the box" },
  ],

  Shots: [
    { time: "22:40", detail: "Right-footed shot from central area" },
    { time: "43:31", result: "Successful", detail: "Shot resulting in goal" },
  ],

  Goals: [
    { time: "43:31", result: "Successful", detail: "Goal from inside the penalty area" },
  ],

  Assists: [
    { time: "34:09", result: "Successful", detail: "Final pass creates teammate goal" },
  ],

  "Possession Won": [
    { time: "04:52", result: "Successful", detail: "Wins loose ball in midfield" },
    { time: "10:11", result: "Successful", detail: "Recovers possession after pressure" },
    { time: "16:43", result: "Successful", detail: "Interception in central area" },
    { time: "23:50", result: "Successful", detail: "Wins second ball" },
    { time: "30:14", result: "Successful", detail: "Regains possession in midfield" },
    { time: "37:02", result: "Successful", detail: "Tackles and recovers the ball" },
    { time: "44:18", result: "Successful", detail: "Late recovery of possession" },
  ],

  Pressures: [
    { time: "03:22", detail: "Closes down opposing midfielder" },
    { time: "07:45", detail: "Pressures receiver from behind" },
    { time: "11:08", detail: "Immediate pressure after turnover" },
    { time: "15:34", detail: "Closes passing lane" },
    { time: "19:52", detail: "Pressures opponent near touchline" },
    { time: "24:07", detail: "Counter-pressure after lost possession" },
  ],
};

function StatCard({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: string | number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition ${
        active
          ? "border-yellow-400 bg-yellow-400/10"
          : "border-white/10 bg-black/40 hover:border-yellow-400/60 hover:bg-black/60"
      }`}
    >
      <div className={active ? "text-xl font-bold text-yellow-400" : "text-xl font-bold text-white"}>
        {value}
      </div>

      <div className="mt-1 text-xs uppercase tracking-wider text-zinc-500">
        {label}
      </div>

      <div className="mt-3 text-[10px] font-bold uppercase tracking-wider text-yellow-400">
        View actions →
      </div>
    </button>
  );
}

function ActionPanel({
  stat,
  onClose,
}: {
  stat: string;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState("All");
  const actions = actionExamples[stat] || [];

  const hasResults = actions.some((action) => action.result);

  const filteredActions =
    filter === "All"
      ? actions
      : actions.filter((action) => action.result === filter);

  return (
    <div className="mt-4 rounded-2xl border border-yellow-400/30 bg-black/40 p-5">
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-400">
            Action Review
          </p>

          <h4 className="mt-1 text-lg font-bold">{stat}</h4>

          <p className="mt-1 text-xs text-zinc-500">
            Click any moment to review the action with match context.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="self-start rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-zinc-400 hover:text-white"
        >
          Close
        </button>
      </div>

      {hasResults && (
        <div className="mt-4 flex flex-wrap gap-2">
          {["All", "Successful", "Unsuccessful"].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`rounded-full px-4 py-2 text-xs font-bold ${
                filter === option
                  ? "bg-yellow-400 text-black"
                  : "bg-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {filteredActions.map((action, index) => (
          <button
            key={`${action.time}-${index}`}
            type="button"
            className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900 text-left transition hover:border-yellow-400/50"
          >
            <div className="flex h-32 items-center justify-center bg-black/60">
              <div className="text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-yellow-400 font-black text-black">
                  ▶
                </div>

                <p className="mt-2 text-[10px] uppercase tracking-wider text-zinc-500">
                  5 sec before • Action • 5 sec after
                </p>
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-white">
                  {action.time}
                </span>

                {action.result && (
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${
                      action.result === "Successful"
                        ? "bg-yellow-400/15 text-yellow-400"
                        : "bg-white/10 text-zinc-400"
                    }`}
                  >
                    {action.result === "Successful" ? "✓ " : "✕ "}
                    {action.result}
                  </span>
                )}
              </div>

              <p className="mt-2 text-sm text-zinc-400">
                {action.detail}
              </p>

              <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-yellow-400">
                Watch clip →
              </p>
            </div>
          </button>
        ))}
      </div>

      {filteredActions.length === 0 && (
        <div className="mt-5 rounded-xl bg-zinc-900 p-6 text-center text-sm text-zinc-500">
          No actions match this filter.
        </div>
      )}

      <p className="mt-4 text-[11px] text-zinc-600">
        Demo action data. Final clips will be generated from the analyzed match video.
      </p>
    </div>
  );
}

function StatSection({
  title,
  subtitle,
  stats,
  activeStat,
  onStatClick,
}: {
  title: string;
  subtitle: string;
  stats: { label: string; value: string | number }[];
  activeStat: string | null;
  onStatClick: (label: string) => void;
}) {
  const sectionLabels = stats.map((stat) => stat.label);
  const showPanel =
    activeStat !== null && sectionLabels.includes(activeStat);

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
            active={activeStat === stat.label}
            onClick={() => onStatClick(stat.label)}
          />
        ))}
      </div>

      {showPanel && activeStat && (
        <ActionPanel
          key={activeStat}
          stat={activeStat}
          onClose={() => onStatClick(activeStat)}
        />
      )}
    </section>
  );
}

export default function DemoPage() {
  const [selected, setSelected] = useState<Player>(players[0]);
  const [activeStat, setActiveStat] = useState<string | null>(null);

  function selectPlayer(player: Player) {
    setSelected(player);
    setActiveStat(null);
  }

  function handleStatClick(label: string) {
    setActiveStat((current) => (current === label ? null : label));
  }

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
                <div key={label} className="rounded-xl bg-black/40 px-4 py-3">
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
                  onClick={() => selectPlayer(player)}
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
              activeStat={activeStat}
              onStatClick={handleStatClick}
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
              activeStat={activeStat}
              onStatClick={handleStatClick}
              stats={[
                { label: "Shots", value: selected.shots },
                { label: "Goals", value: selected.goals },
                { label: "Assists", value: selected.assists },
              ]}
            />

            <StatSection
              title="Defending"
              subtitle="Actions showing defensive involvement and work without the ball"
              activeStat={activeStat}
              onStatClick={handleStatClick}
              stats={[
                { label: "Possession Won", value: selected.won },
                { label: "Pressures", value: selected.pressures },
              ]}
            />
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
            <div className="mb-8 flex h-36 items-center justify-center rounded-xl bg-black/50">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 text-lg font-black text-black">
                  ▶
                </div>
                <p className="mt-3 text-xs text-zinc-500">Video preview</p>
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

          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
            <div className="mb-8 flex h-36 items-center justify-center rounded-xl bg-black/50">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 text-lg font-black text-black">
                  ▶
                </div>
                <p className="mt-3 text-xs text-zinc-500">Video preview</p>
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
