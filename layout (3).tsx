import React from "react";
import Link from "next/link";

const nav = [
  ["Overview","/"],["Teams","/teams"],["Help","/help"],["Settings","/settings"]
];
export default function AppLayout({ children }: { children: React.ReactNode }) {
 return <div className="min-h-screen md:flex">
   <aside className="border-b border-white/10 bg-black/30 backdrop-blur-xl md:fixed md:inset-y-0 md:w-64 md:border-b-0 md:border-r">
    <div className="flex h-20 items-center justify-between px-6 md:justify-start">
      <Link href="/" className="flex items-center gap-3 text-white no-underline">
       <span className="grid h-10 w-10 place-items-center rounded-xl bg-yellow-400 font-black text-black">IFC</span>
       <span><b className="block tracking-tight">InsightFC</b><small className="text-zinc-500">Youth performance</small></span>
      </Link>
    </div>
    <nav className="flex gap-2 overflow-x-auto px-4 pb-4 md:block md:space-y-1">
     {nav.map(([label,href])=><Link key={href} href={href} className="block whitespace-nowrap rounded-xl px-4 py-3 text-sm font-semibold text-zinc-400 no-underline transition hover:bg-white/5 hover:text-white">{label}</Link>)}
    </nav>
    <div className="hidden px-6 md:absolute md:bottom-6 md:block"><p className="text-xs leading-5 text-zinc-600">Built for developing players.<br/>Clear stats. Better conversations.</p></div>
   </aside>
   <main className="min-w-0 flex-1 md:ml-64"><div className="mx-auto max-w-7xl px-5 py-8 md:px-10 md:py-10">{children}</div></main>
 </div>
}