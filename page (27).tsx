 "use client";

import { useMemo, useState } from "react";

type EventType = "Pass" | "Carry" | "Take-on" | "Shot" | "Recovery" | "Turnover" | "Defensive Action";
type Outcome = "Successful" | "Unsuccessful" | "Neutral";

type MatchEvent = {
  id: string;
  minute: string;
  player: string;
  type: EventType;
  outcome: Outcome;
  detail: string;
};

const demoEvents: MatchEvent[] = [
  { id:"e1", minute:"04:18", player:"Player 10", type:"Pass", outcome:"Successful", detail:"Forward pass completed" },
  { id:"e2", minute:"09:42", player:"Player 10", type:"Carry", outcome:"Successful", detail:"12 yd carry" },
  { id:"e3", minute:"13:07", player:"Player 10", type:"Take-on", outcome:"Successful", detail:"Beat 1 opponent and retained possession" },
  { id:"e4", minute:"18:31", player:"Player 10", type:"Shot", outcome:"Neutral", detail:"Shot attempt" },
  { id:"e5", minute:"24:05", player:"Player 10", type:"Recovery", outcome:"Successful", detail:"Ball recovered" },
  { id:"e6", minute:"31:22", player:"Player 10", type:"Take-on", outcome:"Unsuccessful", detail:"Opponent stopped attempt; possession lost" },
];

const eventTypes: EventType[] = ["Pass","Carry","Take-on","Shot","Recovery","Turnover","Defensive Action"];

export default function AnalysisPage() {
  const [stage,setStage]=useState<"upload"|"processing"|"results">("upload");
  const [filter,setFilter]=useState<"All"|EventType>("All");
  const events=useMemo(()=>filter==="All"?demoEvents:demoEvents.filter(e=>e.type===filter),[filter]);

  const stats=useMemo(()=>{
    const all=demoEvents;
    const takeons=all.filter(e=>e.type==="Take-on");
    const won=takeons.filter(e=>e.outcome==="Successful").length;
    return {
      actions: all.length,
      carries: all.filter(e=>e.type==="Carry").length,
      takeons: takeons.length,
      takeonPct: takeons.length ? Math.round(won/takeons.length*100) : 0,
      shots: all.filter(e=>e.type==="Shot").length,
      recoveries: all.filter(e=>e.type==="Recovery").length
    }
  },[]);

  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[.22em] text-yellow-400">InsightFC Analysis</p>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Turn match video into coaching evidence.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">Upload a game, review detected player actions, correct anything that needs coach judgment, then publish verified stats and clips.</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-xs text-zinc-400">
            U8–U12 development • Coach verified
          </div>
        </div>

        <div className="mb-8 grid grid-cols-3 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
          {["Upload game","Process & review","Stats & highlights"].map((x,i)=>{
            const active=(stage==="upload"&&i===0)||(stage==="processing"&&i===1)||(stage==="results"&&i===2);
            return <div key={x} className={`px-4 py-4 text-center text-xs font-semibold md:text-sm ${active?"bg-yellow-400 text-black":"text-zinc-500"}`}>{i+1}. {x}</div>
          })}
        </div>

        {stage==="upload" && (
          <section className="grid gap-6 lg:grid-cols-[1.4fr_.6fr]">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 md:p-8">
              <h2 className="text-xl font-bold">Upload & Analyze Game</h2>
              <p className="mt-2 text-sm text-zinc-400">Start with the full match. InsightFC’s analysis pipeline can later attach detected actions directly to the source video.</p>
              <label className="mt-7 flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-black/20 p-8 text-center hover:border-yellow-400/70">
                <div className="text-3xl">＋</div>
                <div className="mt-3 font-semibold">Choose match video</div>
                <div className="mt-1 text-xs text-zinc-500">Full-game video upload</div>
                <input type="file" accept="video/*" className="hidden"/>
              </label>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <input className="rounded-xl border border-zinc-800 bg-black/30 px-4 py-3 text-sm outline-none focus:border-yellow-400" placeholder="Opponent"/>
                <input type="date" className="rounded-xl border border-zinc-800 bg-black/30 px-4 py-3 text-sm text-zinc-300 outline-none focus:border-yellow-400"/>
              </div>
              <button onClick={()=>setStage("processing")} className="mt-5 w-full rounded-xl bg-yellow-400 px-5 py-3.5 font-bold text-black hover:bg-yellow-300">Continue to analysis</button>
            </div>
            <aside className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
              <h3 className="font-bold">Event rules</h3>
              <div className="mt-5 space-y-5 text-sm">
                <div><div className="font-semibold text-yellow-400">Carry</div><p className="mt-1 leading-6 text-zinc-400">A player advances with the ball for 10 yards or more.</p></div>
                <div><div className="font-semibold text-yellow-400">Take-on</div><p className="mt-1 leading-6 text-zinc-400">A deliberate attempt by a player in possession to beat one or more opponents one-on-one.</p></div>
                <div><div className="font-semibold text-white">Overlap is allowed</div><p className="mt-1 leading-6 text-zinc-400">A sequence can count as both when it independently satisfies both definitions.</p></div>
              </div>
            </aside>
          </section>
        )}

        {stage==="processing" && (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.2em] text-yellow-400">Analysis workspace</p>
                <h2 className="mt-2 text-2xl font-bold">Review before publishing</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">The production computer-vision model is not connected in this preview. This screen defines where detected events, confidence checks, and coach corrections will live.</p>
              </div>
              <button onClick={()=>setStage("results")} className="rounded-xl bg-yellow-400 px-5 py-3 font-bold text-black">Preview verified results</button>
            </div>
            <div className="mt-8 grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
              <div className="flex aspect-video items-center justify-center rounded-2xl border border-zinc-800 bg-black text-sm text-zinc-600">Match video player + event markers</div>
              <div className="rounded-2xl border border-zinc-800 bg-black/20 p-5">
                <div className="text-sm font-bold">Processing pipeline</div>
                {["Upload secured","Player selected / identified","Actions detected","Coach verification","Stats + clips published"].map((x,i)=><div key={x} className="mt-4 flex gap-3 text-sm"><span className={i===0?"text-yellow-400":"text-zinc-600"}>●</span><span className="text-zinc-300">{x}</span></div>)}
              </div>
            </div>
          </section>
        )}

        {stage==="results" && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
              {[["Tracked actions",stats.actions],["Carries 10+ yd",stats.carries],["Take-ons",stats.takeons],["Take-on success",`${stats.takeonPct}%`],["Shots",stats.shots],["Recoveries",stats.recoveries]].map(([a,b])=><div key={String(a)} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5"><div className="text-2xl font-bold">{b}</div><div className="mt-1 text-xs text-zinc-500">{a}</div></div>)}
            </section>
            <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div><h2 className="text-xl font-bold">Player action timeline</h2><p className="mt-1 text-xs text-zinc-500">Select an event to jump to its video moment.</p></div>
                  <select value={filter} onChange={e=>setFilter(e.target.value as any)} className="rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm">
                    <option>All</option>{eventTypes.map(x=><option key={x}>{x}</option>)}
                  </select>
                </div>
                <div className="mt-5 divide-y divide-zinc-800">
                  {events.map(e=><button key={e.id} className="grid w-full grid-cols-[60px_90px_1fr] gap-3 py-4 text-left text-sm hover:bg-white/[.02]"><span className="font-mono text-yellow-400">{e.minute}</span><span className="font-semibold">{e.type}</span><span><span className={e.outcome==="Successful"?"text-emerald-400":e.outcome==="Unsuccessful"?"text-red-400":"text-zinc-400"}>{e.outcome}</span><span className="ml-2 text-zinc-500">{e.detail}</span></span></button>)}
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex aspect-video items-center justify-center rounded-2xl border border-zinc-800 bg-black text-sm text-zinc-600">Event clip preview</div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                  <h3 className="font-bold">Publish after verification</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">Verified events can feed the player profile, match report, personal highlight reel, and family view.</p>
                  <button className="mt-5 w-full rounded-xl bg-yellow-400 px-4 py-3 font-bold text-black">Publish verified analysis</button>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  )
}
