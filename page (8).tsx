"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function TagLandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="p-6 space-y-4">
      <div className="text-2xl font-semibold">Tagging moved</div>

      <div className="text-sm text-muted-foreground max-w-xl">
        This old /tag page is deprecated. Tagging now lives inside a Team → Game flow
        so it can use the correct team roster.
      </div>

      <div className="flex gap-2">
        <button
          className="px-4 py-2 rounded-md border"
          onClick={() => router.push("/teams")}
        >
          Go to Teams
        </button>

        <button
          className="px-4 py-2 rounded-md border"
          onClick={() => router.back()}
        >
          Go Back
        </button>
      </div>

      <div className="text-xs text-muted-foreground">
        Use: Team → Schedule / In Progress / Completed → open a game → Tag
      </div>
    </div>
  );
}