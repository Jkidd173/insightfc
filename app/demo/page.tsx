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
    { time: "17:05", detail: "Receives facing own goal" },
    { time: "19:46", detail: "Controls pass in midfield" },
    { time: "23:12", detail: "Touch into attacking space" },
    { time: "27:38", detail: "Receives under pressure" },
    { time: "32:16", detail: "Controls loose ball" },
    { time: "38:44", detail: "Receives near penalty area" },
  ],

  Passes: [
    {
      time: "03:06",
      result: "Successful",
      detail: "Forward pass into midfield",
    },
    {
      time: "05:44",
      result: "Successful",
      detail: "Short combination pass",
    },
    {
      time: "09:12",
      result: "Unsuccessful",
      detail: "Attempted through ball",
    },
    {
      time: "13:37",
      result: "Successful",
      detail: "Switches play to the right",
    },
    {
      time: "18:02",
      result: "Successful",
      detail: "Pass into attacking third",
    },
    {
      time: "24:16",
      result: "Unsuccessful",
      detail: "Forward pass intercepted",
    },
    {
      time: "28:41",
      result: "Successful",
      detail: "Pass through midfield pressure",
    },
    {
      time: "34:09",
      result: "Successful",
      detail: "Final pass creates a chance",
    },
  ],

  "Carries 10+ yd": [
    {
      time: "06:08",
      result: "Successful",
      detail: "Carries forward through midfield",
    },
    {
      time: "12:51",
      result: "Successful",
      detail: "Progressive carry into space",
    },
    {
      time: "18:33",
      result: "Successful",
      detail: "Carries into attacking third",
    },
    {
      time: "25:20",
      result: "Successful",
      detail: "Breaks pressure with the ball",
    },
    {
      time: "31:07",
      result: "Successful",
      detail: "Carries down central channel",
    },
    {
      time: "38:14",
      result: "Successful",
      detail: "Advances possession 10+ yards",
    },
  ],

  "Take-ons": [
    {
      time: "08:42",
      result: "Successful",
      detail: "Beats defender in central midfield",
    },
    {
      time: "14:18",
      result: "Unsuccessful",
      detail: "Defender wins challenge near touchline",
    },
    {
      time: "21:07",
      result: "Successful",
      detail: "Gets past first defender on the dribble",
    },
    {
      time: "29:33",
      result: "Successful",
      detail: "Changes direction and beats opponent",
    },
    {
      time: "36:11",
      result: "Unsuccessful",
      detail: "Dribble stopped outside attacking third",
    },
    {
      time: "43:26",
      result: "Successful",
      detail: "Beats defender before entering the box",
    },
  ],

  Shots: [
    {
      time: "22:40",
      result: "Unsuccessful",
      detail: "Right-footed shot from central area",
    },
    {
      time: "43:31",
      result: "Successful",
      detail: "Shot resulting in goal",
    },
  ],

  Goals: [
    {
      time: "43:31",
      result: "Successful",
      detail: "Goal from inside the penalty area",
    },
  ],

  Assists: [
    {
      time: "34:09",
      result: "Successful",
      detail: "Final pass creates teammate goal",
    },
  ],

  "Possession Won": [
    {
      time: "04:52",
      result: "Successful",
      detail: "Wins loose ball in midfield",
    },
    {
      time: "10:11",
      result: "Successful",
      detail: "Recovers possession after pressure",
    },
    {
      time: "16:43",
      result: "Successful",
      detail: "Interception in central area",
    },
    {
      time: "23:50",
      result: "Successful",
      detail: "Wins second ball",
    },
    {
      time: "30:14",
      result: "Successful",
      detail: "Regains possession in midfield",
    },
    {
      time: "37:02",
      result: "Successful",
      detail: "Tackles and recovers the ball",
    },
    {
      time: "44:18",
      result: "Successful",
      detail: "Late recovery of possession",
    },
  ],

  Pressures: [
    { time: "03:22", detail: "Closes down opposing midfielder" },
    { time: "07:45", detail: "Pressures receiver from behind" },
    { time: "11:08", detail: "Immediate pressure after turnover" },
    { time: "15:34", detail: "Closes passing lane" },
    { time: "19:52", detail: "Pressures opponent near touchline" },
    { time: "24:07", detail: "Counter-pressure after lost possession" },
    { time: "28:19", detail: "Pressures opponent receiving centrally" },
    { time: "32:48", detail: "Closes down ball carrier" },
  ],
};

function getActionTotal(stat: string, player: Player) {
  switch (stat) {
    case "Touches":
      return player.touches;

    case "Passes": {
      const parts = player.passes.split("/");
      return Number(parts[1]) || 0;
    }

    case "Carries 10+ yd":
      return player.carries;

    case "Take-ons": {
      const parts = player.takeons.split("/");
      return Number(parts[1]) || 0;
    }

    case "Shots":
      return player.shots;

    case "Goals":
      return player.goals;

    case "Assists":
      return player.assists;

    case "Possession Won":
      return player.won;

    case "Pressures":
      return player.pressures;

    default:
      return 0;
  }
}

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
          : "border-white/10 bg-black/30 hover:border-yellow-400/50 hover:bg-black/50"
      }`}
    >
      <div
        className={`text-xl font-black ${
          active ? "text-yellow-400" : "text-white"
        }`}
      >
        {value}
      </div>

      <div className="mt-1 text-xs uppercase tracking-wider text-zinc-500">
        {label}
      </div>

      <div className="mt-3 text-[10px] font-bold uppercase tracking-wider text-yellow-400">
        {active ? "Reviewing ↑" : "View actions →"}
      </div>
    </button>
  );
}

function ActionReview({
  stat,
  player,
  onClose,
}: {
  stat: string;
  player: Player;
  onClose: () => void;
}) {
  const actions = actionExamples[stat] || [];

  const [filter, setFilter] = useState<
    "All" | "Successful" | "Unsuccessful"
  >("All");

  const [selectedIndex, setSelectedIndex] = useState(0);

  const hasResults = actions.some((action) => action.result);

  const filteredActions =
    filter === "All"
      ? actions
      : actions.filter((action) => action.result === filter);

  const selectedAction =
    filteredActions[selectedIndex] || filteredActions[0];

  const actionTotal = getActionTotal(stat, player);

  function changeFilter(
    newFilter: "All" | "Successful" | "Unsuccessful"
  ) {
    setFilter(newFilter);
    setSelectedIndex(0);
  }

  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-yellow-400/30 bg-[#090b0f]">
      {/* HEADER */}
      <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-400">
              Action Review
            </p>

            <span className="text-zinc-700">•</span>

            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              {stat}
            </p>

            <span className="rounded-full bg-yellow-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-400">
              {actionTotal} Actions
            </span>
          </div>

          <p className="mt-2 text-xs text-zinc-500">
            Select a timestamp to review that moment in the match.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasResults &&
            (
              ["All", "Successful", "Unsuccessful"] as const
            ).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => changeFilter(option)}
                className={`rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition ${
                  filter === option
                    ? "bg-yellow-400 text-black"
                    : "bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                {option}
              </button>
            ))}

          <button
            type="button"
            onClick={onClose}
            className="ml-1 rounded-lg border border-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 transition hover:border-white/30 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>

      {/* MAIN REVIEW AREA */}
      <div className="flex flex-col md:h-[470px] md:flex-row">
        {/* TIMELINE */}
        <aside className="order-2 border-t border-white/10 bg-[#0d1015] md:order-1 md:w-[25%] md:border-r md:border-t-0">
          <div className="flex h-11 items-center border-b border-white/10 px-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
              Match Timeline
            </p>
          </div>

          <div className="max-h-[320px] overflow-y-auto md:h-[calc(470px-44px)] md:max-h-none">
            {filteredActions.map((action, index) => {
              const active = index === selectedIndex;

              return (
                <button
                  key={`${action.time}-${index}`}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={`group w-full border-b border-white/5 px-4 py-4 text-left transition ${
                    active
                      ? "bg-yellow-400/10"
                      : "hover:bg-white/[0.035]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-black transition ${
                        active
                          ? "bg-yellow-400 text-black"
                          : "bg-white/5 text-zinc-600 group-hover:text-zinc-300"
                      }`}
                    >
                      ▶
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={`text-sm font-black ${
                            active
                              ? "text-yellow-400"
                              : "text-white"
                          }`}
                        >
                          {action.time}
                        </span>

                        {action.result && (
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wide ${
                              action.result === "Successful"
                                ? "text-yellow-400"
                                : "text-zinc-600"
                            }`}
                          >
                            {action.result === "Successful"
                              ? "✓ Success"
                              : "✕ Unsuccessful"}
                          </span>
                        )}
                      </div>

                      <p
                        className={`mt-1.5 text-xs leading-relaxed ${
                          active
                            ? "text-zinc-300"
                            : "text-zinc-500"
                        }`}
                      >
                        {action.detail}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}

            {filteredActions.length === 0 && (
              <div className="p-6 text-center text-xs text-zinc-500">
                No actions match this filter.
              </div>
            )}
          </div>
        </aside>

        {/* VIDEO */}
        <div className="order-1 flex min-w-0 flex-1 flex-col bg-black md:order-2">
          <div className="flex min-h-[330px] flex-1 items-center justify-center p-4 md:min-h-0 md:p-5">
            {selectedAction ? (
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[#030405]">
                <div className="text-center">
                  <button
                    type="button"
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400 text-2xl font-black text-black shadow-lg transition hover:scale-105"
                    aria-label="Play selected match clip"
                  >
                    ▶
                  </button>

                  <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
                    Match Video
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">
                Select an action to review.
              </p>
            )}
          </div>

          {/* COMPACT VIDEO FOOTER */}
          {selectedAction && (
            <div className="flex flex-col gap-3 border-t border-white/10 bg-[#0d1015] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <span className="shrink-0 text-xl font-black text-yellow-400">
                  {selectedAction.time}
                </span>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-200">
                    {selectedAction.detail}
                  </p>

                  {selectedAction.result && (
                    <p
                      className={`mt-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        selectedAction.result === "Successful"
                          ? "text-yellow-400"
                          : "text-zinc-500"
                      }`}
                    >
                      {selectedAction.result === "Successful"
                        ? "✓ Successful"
                        : "✕ Unsuccessful"}
                    </p>
                  )}
                </div>
              </div>

              <div className="shrink-0 text-left sm:text-right">
                <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">
                  Clip Context
                </p>

                <p className="mt-0.5 text-[10px] text-zinc-400">
                  5 sec before • action • 5 sec after
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 bg-[#090b0f] px-5 py-2">
        <p className="text-[9px] text-zinc-700">
          Prototype timeline uses representative demo events. Final
          timeline will contain every verified action from the analyzed
          match.
        </p>
      </div>
    </div>
  );
}

function StatSection({
  title,
  subtitle,
  stats,
  player,
  activeStat,
  onStatClick,
}: {
  title: string;
  subtitle: string;
  stats: { label: string; value: string | number }[];
  player: Player;
  activeStat: string | null;
  onStatClick: (label: string) => void;
}) {
  const labels = stats.map((stat) => stat.label);

  const showReview =
    activeStat !== null && labels.includes(activeStat);

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

      {showReview && activeStat && (
        <ActionReview
          key={`${player.number}-${activeStat}`}
          stat={activeStat}
          player={player}
          onClose={() => onStatClick(activeStat)}
        />
      )}
    </section>
  );
}

export default function DemoPage() {
  const [selected, setSelected] = useState<Player>(players[0]);

  const [activeStat, setActiveStat] = useState<string | null>(
    null
  );

  function selectPlayer(player: Player) {
    setSelected(player);
    setActiveStat(null);
  }

  function handleStatClick(label: string) {
    setActiveStat((current) =>
      current === label ? null : label
    );
  }

  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      <div className="bg-yellow-400 px-4 py-2 text-center text-xs font-bold uppercase tracking-widest text-black">
        Demo Data — InsightFC Testing Environment
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* HEADER */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">
            InsightFC Coach Dashboard
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Northside U10
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Demo team • Player development and match analysis
          </p>
        </div>

        {/* SUMMARY */}
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

        {/* MATCH */}
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

        {/* PLAYERS */}
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
              const active =
                selected.number === player.number;

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
                        active
                          ? "text-yellow-400"
                          : "text-zinc-500"
                      }`}
                    >
                      #{player.number}
                    </span>

                    <span className="rounded-full bg-black/50 px-3 py-1 text-xs text-zinc-400">
                      {player.pos}
                    </span>
                  </div>

                  <div className="mt-4 font-bold">
                    {player.name}
                  </div>

                  <div className="mt-1 text-xs text-zinc-500">
                    U10
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* PLAYER REPORT */}
        <section className="mb-8 rounded-2xl border border-white/10 bg-zinc-900 p-6">
          <div className="mb-6 border-b border-white/10 pb-5">
            <p className="text-xs font-bold uppercase tracking-wider text-yellow-400">
              Player Match Report
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              {selected.name}
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Latest match vs Riverside U10
            </p>
          </div>

          <div className="space-y-5">
            <StatSection
              title="In Possession"
              subtitle="How the player used and progressed the ball"
              player={selected}
              activeStat={activeStat}
              onStatClick={handleStatClick}
              stats={[
                {
                  label: "Touches",
                  value: selected.touches,
                },
                {
                  label: "Passes",
                  value: selected.passes,
                },
                {
                  label: "Carries 10+ yd",
                  value: selected.carries,
                },
                {
                  label: "Take-ons",
                  value: selected.takeons,
                },
              ]}
            />

            <StatSection
              title="Attacking"
              subtitle="Actions that directly contributed to creating or finishing chances"
              player={selected}
              activeStat={activeStat}
              onStatClick={handleStatClick}
              stats={[
                {
                  label: "Shots",
                  value: selected.shots,
                },
                {
                  label: "Goals",
                  value: selected.goals,
                },
                {
                  label: "Assists",
                  value: selected.assists,
                },
              ]}
            />

            <StatSection
              title="Defending"
              subtitle="Actions showing defensive involvement and work without the ball"
              player={selected}
              activeStat={activeStat}
              onStatClick={handleStatClick}
              stats={[
                {
                  label: "Possession Won",
                  value: selected.won,
                },
                {
                  label: "Pressures",
                  value: selected.pressures,
                },
              ]}
            />
          </div>
        </section>

        {/* HIGHLIGHTS */}
        <section className="grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
            <div className="mb-6 flex h-36 items-center justify-center rounded-xl bg-black/50">
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

            <h3 className="mt-2 text-xl font-bold">
              Team Highlight Reel
            </h3>

            <p className="mt-2 text-sm text-zinc-500">
              Review the key moments from the match.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
            <div className="mb-6 flex h-36 items-center justify-center rounded-xl bg-black/50">
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

        {/* FULL MATCH */}
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
