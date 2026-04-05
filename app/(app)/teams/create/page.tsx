// app/(app)/teams/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type TeamRow = {
  id: string;
  name: string | null;
  created_at?: string | null;
};

export default async function TeamsPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Teams</h1>
          <p className="mt-2 text-sm text-white/70">
            Debug view for Supabase teams loading.
          </p>
        </div>

        <Link
          href="/teams/create"
          className="rounded-xl bg-yellow-400 px-5 py-3 font-semibold text-black"
        >
          Create Team
        </Link>
      </div>

      <div className="mb-6 rounded-2xl border border-white/10 p-4">
        <h2 className="text-lg font-semibold">Debug Info</h2>
        <div className="mt-3 space-y-2 text-sm text-white/80">
          <p>
            <span className="font-semibold">Logged in user:</span>{" "}
            {user.email ?? user.id}
          </p>
          <p>
            <span className="font-semibold">User ID:</span> {user.id}
          </p>
          <p>
            <span className="font-semibold">Teams error:</span>{" "}
            {teamsError ? teamsError.message : "none"}
          </p>
          <p>
            <span className="font-semibold">Teams count:</span>{" "}
            {teams ? teams.length : 0}
          </p>
        </div>
      </div>

      {teamsError ? (
        <div className="mb-6 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Failed to load teams: {teamsError.message}
        </div>
      ) : null}

      <div className="mb-6 rounded-2xl border border-white/10 p-4">
        <h2 className="text-lg font-semibold">Raw Teams Data</h2>
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-sm text-white/70">
          {JSON.stringify(teams, null, 2)}
        </pre>
      </div>

      {teams && teams.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team: TeamRow) => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="block rounded-2xl border border-white/10 p-5 transition hover:border-white/30"
            >
              <h2 className="text-xl font-semibold">
                {team.name || "Untitled Team"}
              </h2>
              <p className="mt-2 break-all text-sm text-white/60">
                Team ID: {team.id}
              </p>
              {team.created_at ? (
                <p className="mt-2 text-xs text-white/50">
                  Created: {new Date(team.created_at).toLocaleString()}
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 p-8 text-center">
          <h2 className="text-xl font-semibold">No teams returned</h2>
          <p className="mt-2 text-sm text-white/70">
            This means the query returned an empty array.
          </p>
        </div>
      )}
    </div>
  );
}