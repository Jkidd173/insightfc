"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

function looksLikeUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const teamId = (params?.teamId as string | undefined) ?? "";

  if (!looksLikeUuid(teamId)) {
    return (
      <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ fontSize: 26, fontWeight: 950, marginBottom: 8 }}>
          Invalid Team Link
        </h1>
        <div style={{ opacity: 0.85, marginBottom: 14 }}>
          That URL doesn’t contain a valid team id.
        </div>
        <Link href="/teams" style={btnStyle}>
          Go to Teams
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <Link href={`/teams/${teamId}`} style={tabStyle}>
          Team Home
        </Link>
        <Link href={`/teams/${teamId}/schedule`} style={tabStyle}>
          Schedule
        </Link>
        <Link href={`/teams/${teamId}/in-progress`} style={tabStyle}>
          In Progress
        </Link>
        <Link href={`/teams/${teamId}/completed`} style={tabStyle}>
          Completed
        </Link>
        <Link href={`/teams/${teamId}/players`} style={tabStyle}>
          Players
        </Link>
      </div>

      {children}
    </div>
  );
}

const tabStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  fontWeight: 950,
  border: "1px solid rgba(255,255,255,0.18)",
  textDecoration: "none",
  color: "inherit",
};

const btnStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  fontWeight: 950,
  border: "1px solid rgba(255,255,255,0.18)",
  textDecoration: "none",
  color: "inherit",
  display: "inline-block",
};