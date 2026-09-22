"use client";
import {useEffect,useState} from "react"; import {useParams} from "next/navigation"; import Link from "next/link"; import {supabase} from "@/lib/supabaseClient";
type Team={id:string;name:string;season:string};
export default function TeamHomePage(){
 const {teamId}=useParams() as {teamId:string}; const [team,setTeam]=useState<Team|null>(null); const [loading,setLoading]=useState(true); const [error,setError]=useState<string|null>(null);
 useEffect(()=>{(async()=>{try{const {data,error}=await supabase.from("teams").select("id,name,season").eq("id",teamId).single();if(error)throw error;setTeam(data as Team)}catch(e:any){setError(e?.message||"Failed to load team.")}finally{setLoading(false)}})()},[teamId]);
 if(loading)return <div className="card text-zinc-400">Loading team workspace…</div>;
 if(error||!team)return <div className="card border-red-500/20 text-red-300">{error||"Team not found."}</div>;
 return <div className="space-y-7">
  <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><div className="eyebrow">Team workspace</div><h1 className="page-title mt-2">{team.name}</h1><p className="muted mt-2">{team.season||"Current season"} · Player development hub</p></div><Link href={`/teams/${teamId}/schedule`} className="btn-yellow">+ Schedule match</Link></header>
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
   {[["Players","Roster & profiles","Manage roster"],["Matches","Schedule & video","View schedule"],["Analysis","Player actions","Review games"],["Highlights","Players & team","Coming soon"]].map(([a,b,c])=><div className="stat-card" key={a}><p className="text-xs font-bold uppercase tracking-wider text-zinc-500">{a}</p><p className="mt-3 text-2xl font-bold">{b}</p><p className="mt-4 text-sm text-yellow-400">{c} →</p></div>)}
  </div>
  <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]"><section className="card"><div className="flex items-center justify-between"><div><p className="eyebrow">Development</p><h2 className="mt-2 text-xl font-bold">Team activity</h2></div><span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-400">Season view</span></div><div className="mt-8 rounded-xl border border-dashed border-white/10 px-5 py-10 text-center"><p className="font-semibold">Your performance story starts here</p><p className="muted mx-auto mt-2 max-w-md text-sm">As matches are analyzed, touches, passing, carries, recoveries and other age-appropriate development stats will appear here.</p></div></section>
  <aside className="card"><p className="eyebrow">Quick actions</p><div className="mt-4 space-y-2"><Link className="btn-ghost w-full justify-between" href={`/teams/${teamId}/players`}>Manage players <span>→</span></Link><Link className="btn-ghost w-full justify-between" href={`/teams/${teamId}/schedule`}>Schedule match <span>→</span></Link><Link className="btn-ghost w-full justify-between" href={`/teams/${teamId}/in-progress`}>Active analysis <span>→</span></Link><Link className="btn-ghost w-full justify-between" href={`/teams/${teamId}/completed`}>Match archive <span>→</span></Link></div></aside></div>
 </div>
}