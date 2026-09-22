import { Suspense } from "react";
import SignupClient from "./signup-client";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
      <SignupClient />
    </Suspense>
  );
}