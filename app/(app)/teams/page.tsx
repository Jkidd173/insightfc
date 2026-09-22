import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
type TeamRow={id:string;name:string|null;season?:string|null;created_at?:string|null};
export default async function TeamsPage(){
 const supabase=await createClient(); const {data:{user},error:userError}=await supabase.auth.getUser();
 if(userError||!user) redirect("/login");
 const {data:teams,error}=await supabase.from("teams").select("id,name,season,created_at").order("created_at",{ascending:false});
 return <div className="space-y-8">
  <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
   <div><div className="eyebrow">Club workspace</div><h1 className="page-title mt-2">Your teams</h1><p className="muted mt-2 max-w-xl">Manage rosters, matches and player development from one place.</p></div>
   <Link href="/teams/create" className="btn-yellow">+ Add team</Link>
  </header>
  {error?<div className="card border-red-500/20 text-red-300">We couldn’t load your teams. Please try again.</div>:null}
  {teams?.length?<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{teams.map((team:TeamRow)=>
   <Link key={team.id} href={`/teams/${team.id}`} className="group card block no-underline transition hover:-translate-y-0.5 hover:border-yellow-400/30">
    <div className="mb-8 flex items-start justify-between"><div className="grid h-12 w-12 place-items-center rounded-xl bg-yellow-400/10 text-lg font-black text-yellow-400">{(team.name||"T").slice(0,2).toUpperCase()}</div><span className="text-zinc-600 transition group-hover:text-yellow-400">↗</span></div>
    <h2 className="text-xl font-bold text-white">{team.name||"Untitled team"}</h2><p className="mt-1 text-sm text-zinc-500">{team.season||"Season not set"}</p>
    <div className="mt-5 border-t border-white/10 pt-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Open team workspace</div>
   </Link>)}</div>:
   <div className="card py-14 text-center"><div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-yellow-400/10 text-yellow-400">＋</div><h2 className="text-xl font-bold">Build your first roster</h2><p className="muted mx-auto mt-2 max-w-md">Add a team to begin scheduling matches, adding players and tracking development.</p><Link href="/teams/create" className="btn-yellow mt-6">Create team</Link></div>}
 </div>
}