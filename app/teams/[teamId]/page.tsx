// app/teams/[teamId]/page.tsx
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function TeamHomePage() {
  const params = useParams();
  const teamId = params.teamId as string;

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Team Home</h1>
        <p className="muted">Choose a section to continue.</p>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-wrap gap-4">
        <Link
          href={`/teams/${teamId}/schedule`}
          className="btn-yellow btn-yellow-text text-outline"
        >
          Schedule
        </Link>

        <Link
          href={`/teams/${teamId}/in-progress`}
          className="btn-yellow btn-yellow-text text-outline"
        >
          In Progress
        </Link>

        <Link
          href={`/teams/${teamId}/completed`}
          className="btn-yellow btn-yellow-text text-outline"
        >
          Completed
        </Link>

        <Link
          href={`/teams/${teamId}/players`}
          className="btn-yellow btn-yellow-text text-outline"
        >
          Players
        </Link>
      </div>

      {/* Placeholder Card */}
      <div className="card">
        <div className="muted">
          Team overview and quick stats will live here later (record, trends,
          top actions, etc.).
        </div>
      </div>
    </div>
  );
}