"use client";

import { useMemo, useState } from "react";

const players = [
  {n:"10",name:"Eli Carter",pos:"CM",touches:58,passes:"31/38",carries:6,takeons:"4/6",shots:2,goals:1,assists:1,won:7,pressures:12},
  {n:"7",name:"Noah Brooks",pos:"RW",touches:46,passes:"18/23",carries:8,takeons:"6/9",shots:4,goals:2,assists:0,won:3,pressures:8},
  {n:"8",name:"Liam Reed",pos:"CM",touches:52,passes:"29/35",carries:5,takeons:"2/3",shots:1,goals:0,assists:1,won:8,pressures:14},
  {n:"4",name:"Mason Lee",pos:"CB",touches:41,passes:"25/30",carries:2,takeons:"0/1",shots:0,goals:0,assists:0,won:11,pressures:7},
  {n:"11",name:"Owen Hayes",pos:"LW",touches:39,passes:"14/20",carries:7,takeons:"5/8",shots:3,goals:1,assists:1,won:4,pressures:9},
];

const events = [
 ["04:18","Eli Carter","Pass","Successful","Forward pass completed"],
 ["07:41","Noah Brooks","Take-on","Successful","Beat defender 1v1"],
 ["09:42","Eli Carter","Carry","Successful","14 yd carry"],
 ["12:16","Liam Reed","Pressure","Successful","Forced backward pass"],
 ["13:07","Eli Carter","Take-on","Successful","Beat 1 opponent; retained possession"],
 ["18:31","Noah Brooks","Shot","Successful","Shot on target"],
 ["18:33","Noah Brooks","Goal","Successful","Goal"],
 ["22:54","Eli Carter","Assist","Successful","Final pass leading directly to goal"],
 ["24:05","Mason Lee","Possession won","Successful","Interception"],
 ["31:22","Eli Carter","Take-on","Unsuccessful","Stopped by defender; possession lost"],
];

export default function DemoPage(){
 const [tab,setTab]=useState("Dashboard");
 const [player,setPlayer]=useState(players[0]);
 const [filter,setFilter]=useState("All");
 const filtered=useMemo(()=>filter==="All"?events:events.filter(e=>e[2]===filter),[filter]);
 const tabs=["Dashboard","My Team","Game Analysis","Players","Highlights"];
 return <main className="min-h-screen bg-[#07090d] text-white">
  <div className="border-b border-yellow-400/20 bg-yellow-400 px-4 py-2 text-center text-xs font-bold text-black">DEMO DATA — nothing on this page is written to your real account</div>
  <div className="mx-auto max-w-7xl px-5 py-7 md:px-8">
   <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
    <div><div className="text-xs font-semibold uppercase tracking-[.2em] text-yellow-400">InsightFC Coach Demo</div><h1 className="mt-2 text-3xl font-bold">Northside U10</h1><p className="mt-1 text-sm text-zinc-500">A populated sandbox for testing the InsightFC experience.</p></div>
    <a href="/analysis" className="rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-black">Upload & Analyze Game</a>
   </div>
   <div className="mt-7 flex gap-2 overflow-x-auto pb-2">{tabs.map(t=><button key={t} onClick={()=>setTab(t)} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold ${tab===t?"bg-white text-black":"border border-zinc-800 bg-zinc-900 text-zinc-400"}`}>{t}</button>)}</div>

   {tab==="Dashboard" && <div className="mt-6">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["Players",12],["Games analyzed",6],["Goals",14],["Verified actions",438]].map(x=><div key={String(x[0])} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5"><div className="text-3xl font-bold">{x[1]}</div><div className="mt-1 text-xs text-zinc-500">{x[0]}</div></div>)}</div>
    <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_.8fr]"><section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6"><div className="text-xs font-semibold uppercase tracking-widest text-yellow-400">Latest game</div><h2 className="mt-2 text-2xl font-bold">Northside U10 4–2 Riverside U10</h2><p className="mt-2 text-sm text-zinc-500">Sep 20 • Analysis verified</p><div className="mt-6 grid grid-cols-3 gap-3">{[["Pass completion","78%"],["Take-ons won","17"],["Possession won","33"]].map(x=><div key={x[0]} className="rounded-xl bg-black/30 p-4"><div className="text-xl font-bold">{x[1]}</div><div className="mt-1 text-xs text-zinc-500">{x[0]}</div></div>)}</div><button onClick={()=>setTab("Game Analysis")} className="mt-5 text-sm font-bold text-yellow-400">Open match analysis →</button></section>
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6"><h2 className="font-bold">What needs your attention</h2><div className="mt-5 space-y-4 text-sm text-zinc-300"><div>3 player clips ready to review</div><div>Latest match analysis verified</div><div>5 new player highlight moments</div></div></section></div>
   </div>}

   {tab==="My Team" && <div className="mt-6"><h2 className="text-xl font-bold">Roster snapshot</h2><div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{players.map(p=><button key={p.n} onClick={()=>{setPlayer(p);setTab("Players")}} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 text-left hover:border-yellow-400/50"><div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 font-black text-black">{p.n}</div><div><div className="font-bold">{p.name}</div><div className="text-xs text-zinc-500">{p.pos} • U10</div></div></div><div className="mt-5 grid grid-cols-3 gap-2 text-center"><div><b>{p.touches}</b><div className="text-[10px] text-zinc-500">Touches</div></div><div><b>{p.carries}</b><div className="text-[10px] text-zinc-500">Carries</div></div><div><b>{p.pressures}</b><div className="text-[10px] text-zinc-500">Pressures</div></div></div></button>)}</div></div>}

   {tab==="Game Analysis" && <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_.75fr]"><section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5"><div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">Action timeline</h2><p className="text-xs text-zinc-500">Northside U10 vs Riverside U10</p></div><select value={filter} onChange={e=>setFilter(e.target.value)} className="rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm"><option>All</option>{["Pass","Carry","Take-on","Shot","Goal","Assist","Pressure","Possession won"].map(x=><option key={x}>{x}</option>)}</select></div><div className="mt-5 divide-y divide-zinc-800">{filtered.map((e,i)=><div key={i} className="grid grid-cols-[55px_100px_1fr] gap-3 py-4 text-sm"><span className="font-mono text-yellow-400">{e[0]}</span><b>{e[2]}</b><span className="text-zinc-400">{e[1]} — {e[4]}</span></div>)}</div></section><aside><div className="flex aspect-video items-center justify-center rounded-2xl border border-zinc-800 bg-black text-sm text-zinc-600">Click an action to preview its clip</div><div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5"><b>Match outputs</b><p className="mt-2 text-sm leading-6 text-zinc-400">Goals, assists, shots, passes, carries 10+ yd, take-ons, pressures, possession won and turnovers can all feed verified player reports and highlights.</p></div></aside></div>}

   {tab==="Players" && <div className="mt-6"><div className="flex gap-2 overflow-x-auto">{players.map(p=><button key={p.n} onClick={()=>setPlayer(p)} className={`rounded-xl px-4 py-2 text-sm ${player.n===p.n?"bg-yellow-400 font-bold text-black":"bg-zinc-900 text-zinc-400"}`}>{p.name}</button>)}</div><div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6"><div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400 text-xl font-black text-black">{player.n}</div><div><h2 className="text-2xl font-bold">{player.name}</h2><p className="text-sm text-zinc-500">{player.pos} • Northside U10 • Latest match</p></div></div><div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{[["Touches",player.touches],["Passes",player.passes],["Carries",player.carries],["Take-ons",player.takeons],["Goals",player.goals],["Assists",player.assists],["Shots",player.shots],["Poss. won",player.won],["Pressures",player.pressures]].map(x=><div key={x[0]} className="rounded-xl bg-black/30 p-4"><div className="text-xl font-bold">{x[1]}</div><div className="mt-1 text-xs text-zinc-500">{x[0]}</div></div>)}</div></div></div>}

   {tab==="Highlights" && <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{["Eli — Goal + assist","Noah — 2 goals","Team — Match highlights","Eli — Take-ons","Defensive actions","Full game"].map((x,i)=><div key={x} className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60"><div className="flex aspect-video items-center justify-center bg-black text-3xl text-zinc-700">▶</div><div className="p-4"><b>{x}</b><div className="mt-1 text-xs text-zinc-500">{i===5?"Full match video":"Verified clips"}</div></div></div>)}</div>}
  </div>
 </main>
}
