// app/teams/[teamId]/components/TeamTabsShell.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

function TabLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={active ? "btn-yellow btn-yellow-text text-outline" : "btn-ghost"}
    >
      {label}
    </Link>
  );
}

export default function TeamTabsShell({
  teamId,
  children,
}: {
  teamId: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const base = `/teams/${teamId}`;

  return (
    <div className="space-y-6">
      <div className="card flex flex-col gap-4">
        <div className="flex flex-wrap gap-3">
          <TabLink href={base} label="Team Home" active={pathname === base} />
          <TabLink href={`${base}/schedule`} label="Schedule" active={pathname === `${base}/schedule`} />
          <TabLink href={`${base}/in-progress`} label="In Progress" active={pathname === `${base}/in-progress`} />
          <TabLink href={`${base}/completed`} label="Completed" active={pathname === `${base}/completed`} />
          <TabLink href={`${base}/players`} label="Players" active={pathname === `${base}/players`} />
        </div>

        <div className="text-xs text-zinc-500">
          Team ID: <span className="text-zinc-300">{teamId}</span>
        </div>
      </div>

      <div>{children}</div>
    </div>
  );
}