"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function HQPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const supabase = supabaseBrowser();
        const { data, error } = await supabase.auth.getUser();

        if (error) throw error;

        if (!data?.user) {
          router.replace("/login?next=/hq");
          return;
        }

        if (!alive) return;
        setEmail(data.user.email ?? "Unknown");
      } catch (e) {
        // If anything goes wrong, send them to login
        router.replace("/login?next=/hq");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, [router]);

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 34, fontWeight: 900, marginBottom: 10 }}>HQ</h1>

      <p style={{ opacity: 0.8, marginBottom: 18 }}>
        If you can see this page, /hq routing is working.
      </p>

      <div style={{ display: "flex", gap: 10 }}>
        <Link href="/teams">Teams</Link>
        <Link href="/help">Help</Link>
        <Link href="/settings">Settings</Link>
      </div>

      <div style={{ marginTop: 20, opacity: 0.7, fontSize: 14 }}>
        {loading ? "Loading..." : `Logged in as: ${email}`}
      </div>
    </div>
  );
}