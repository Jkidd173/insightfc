"use client";

import { useEffect, useState } from "react";

type Props = { teamId: string };

type Team = { id: string; name?: string };
type DB = { version: number; teams?: Team[] };

export default function TeamHeader({ teamId }: Props) {
  const [mounted, setMounted] = useState(false);
  const [teamName, setTeamName] = useState<string>("Team");

  useEffect(() => {
    setMounted(true);

    const raw = window.localStorage.getItem("insightfc_db");
    if (!raw) return;

    try {
      const db: DB = JSON.parse(raw);
      const found = db.teams?.find((t) => t.id === teamId);
      if (found?.name) setTeamName(found.name);
    } catch {
      // ignore
    }
  }, [teamId]);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">{mounted ? teamName : "Team"}</h1>
        <p className="text-xs text-gray-500">
          Team ID: <span className="font-mono">{teamId}</span>
        </p>
      </div>
    </div>
  );
}