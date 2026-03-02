// app/(app)/layout.tsx
import React from "react";
import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header
        style={{
          height: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          borderBottom: "1px solid rgba(255,255,255,0.15)",
          position: "sticky",
          top: 0,
          background: "black",
          zIndex: 100,
        }}
      >
        <Link
          href="/"
          style={{
            fontWeight: 900,
            textDecoration: "none",
            color: "white",
            letterSpacing: 0.2,
          }}
        >
          InsightFC
        </Link>

        <nav style={{ display: "flex", gap: 16 }}>
          <Link href="/teams" style={linkStyle}>
            Teams
          </Link>
          <Link href="/help" style={linkStyle}>
            Help
          </Link>
          <Link href="/settings" style={linkStyle}>
            Settings
          </Link>
        </nav>
      </header>

      <main>{children}</main>
    </div>
  );
}

const linkStyle: React.CSSProperties = {
  textDecoration: "none",
  color: "white",
  fontWeight: 800,
  fontSize: 14,
  opacity: 0.95,
};