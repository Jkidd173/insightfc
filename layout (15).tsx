"use client";
import React from "react"; import Link from "next/link"; import {useParams,usePathname} from "next/navigation";
export default function TeamLayout({children}:{children:React.ReactNode}){
 const params=useParams(), pathname=usePathname(), teamId=(params?.teamId as string)||""; const base=`/teams/${teamId}`;
 const tabs=[["Overview",base],["Schedule",`${base}/schedule`],["In progress",`${base}/in-progress`],["Completed",`${base}/completed`],["Players",`${base}/players`]];
 return <div className="space-y-7">
  <div><Link href="/teams" className="text-sm font-semibold text-zinc-500 no-underline hover:text-white">← All teams</Link>
   <nav className="mt-5 flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/[.025] p-1.5">
    {tabs.map(([label,href])=><Link key={href} href={href} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold no-underline transition ${pathname===href?"bg-yellow-400 text-black":"text-zinc-400 hover:bg-white/5 hover:text-white"}`}>{label}</Link>)}
   </nav>
  </div>{children}
 </div>
}