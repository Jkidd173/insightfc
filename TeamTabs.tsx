"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  teamId: string;
};

function isActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href !== "/" && pathname.startsWith(href + "/")) return true;
  return false;
}

export default function TeamTabs({ teamId }: Props) {
  const pathname = usePathname();

  const tabs = [
    { label: "Team Home", href: `/teams/${teamId}` },
    { label: "Schedule", href: `/teams/${teamId}/schedule` },
    { label: "In Progress", href: `/teams/${teamId}/in-progress` },
    { label: "Completed", href: `/teams/${teamId}/completed` },
    { label: "Players", href: `/teams/${teamId}/players` },
  ];

  // This creates a black outline around white letters
  const outlinedWhiteText: React.CSSProperties = {
    color: "#fff",
    textShadow:
      "-1px -1px 0 #000,  1px -1px 0 #000, -1px  1px 0 #000,  1px  1px 0 #000",
  };

  return (
    <nav aria-label="Team navigation" style={{ width: "100%" }}>
      <div
        style={{
          width: "100%",
          overflowX: "auto",
          padding: "10px 16px",
          background: "#000",
          borderBottom: "1px solid rgba(255,255,255,0.15)",
          whiteSpace: "nowrap",
        }}
      >
        {tabs.map((tab) => {
          const active = isActive(pathname, tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              style={{
                display: "inline-block",
                marginRight: 10,
                padding: "10px 14px",
                borderRadius: 12,
                background: active ? "#f59e0b" : "#fbbf24", // slightly darker for active
                border: "2px solid #000",
                fontWeight: 800,
                fontSize: 14,
                textDecoration: "none",
                ...outlinedWhiteText,
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}