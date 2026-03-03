"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    async function run() {
      const supabase = supabaseBrowser();
      await supabase.auth.signOut();
      router.replace("/login");
    }
    run();
  }, [router]);

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: "0 16px" }}>
      <p>Signing you out...</p>
    </div>
  );
}