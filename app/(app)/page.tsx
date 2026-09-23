import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Team = {
  id: string;
  name: string | null;
  season: string | null;
  created_at?: string | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: teams, error } = await supabase
    .from("teams")
    .select("id,name,season,created_at")
    .order("created_at", { ascending: false });

  const teamList = (teams ?? []) as Team[];

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="eyebrow">Coach workspace</div>

          <h1 className="page-title mt-2">
            Welcome to InsightFC
          </h1>

          <p className="muted mt-2 max-w-2xl">
            Choose a team to view its roster, schedule, matches,
            player development, and performance stats.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/upload"
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white no-underline transition hover:border-yellow-400/40"
          >
            Upload Match
          </Link>

          <Link href="/teams/create" className="btn-yellow">
            + Add Team
          </Link>
        </div>
      </header>

      {/* ERROR */}
      {error && (
        <div className="card border-red-500/20">
          <p className="font-semibold text-red-300">
            We couldn&apos;t load your teams.
          </p>

          <p className="muted mt-1 text-sm">
            Refresh the page and try again.
          </p>
        </div>
      )}

      {/* SUMMARY */}
      {!error && teamList.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="card">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
              Your Teams
            </div>

            <div className="mt-3 text-3xl font-black text-white">
              {teamList.length}
            </div>

            <p className="muted mt-1 text-sm">
              {teamList.length === 1
                ? "team in your workspace"
                : "teams in your workspace"}
            </p>
          </div>

          <div className="card">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
              Match Analysis
            </div>

            <div className="mt-3 text-xl font-black text-white">
              Upload footage
            </div>

            <p className="muted mt-1 text-sm">
              Add match video and prepare it for InsightFC analysis.
            </p>
          </div>

          <div className="card sm:col-span-2 lg:col-span-1">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
              Development
            </div>

            <div className="mt-3 text-xl font-black text-white">
              Player focused
            </div>

            <p className="muted mt-1 text-sm">
              Turn match actions into useful coaching conversations.
            </p>
          </div>
        </section>
      )}

      {/* TEAMS */}
      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">
              Your Teams
            </h2>

            <p className="muted mt-1 text-sm">
              Select a team to open its workspace.
            </p>
          </div>

          {teamList.length > 0 && (
            <Link
              href="/teams"
              className="text-sm font-bold text-yellow-400 no-underline hover:text-yellow-300"
            >
              Manage teams →
            </Link>
          )}
        </div>

        {!error && teamList.length === 0 ? (
          <div className="card py-14 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-yellow-400/10 text-2xl font-black text-yellow-400">
              +
            </div>

            <h2 className="text-xl font-bold text-white">
              Add your first team
            </h2>

            <p className="muted mx-auto mt-2 max-w-md">
              Create a team to add players, manage matches, upload
              footage, and begin tracking development.
            </p>

            <Link href="/teams/create" className="btn-yellow mt-6">
              Create Team
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {teamList.map((team) => (
              <Link
                key={team.id}
                href={`/teams/${team.id}`}
                className="group card block no-underline transition hover:-translate-y-0.5 hover:border-yellow-400/30"
              >
                <div className="mb-8 flex items-start justify-between">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-yellow-400/10 text-lg font-black text-yellow-400">
                    {(team.name || "T")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>

                  <span className="text-zinc-600 transition group-hover:text-yellow-400">
                    ↗
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white">
                  {team.name || "Untitled team"}
                </h3>

                <p className="mt-1 text-sm text-zinc-500">
                  {team.season || "Season not set"}
                </p>

                <div className="mt-5 border-t border-white/10 pt-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Open team overview
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* QUICK ACTIONS */}
      {teamList.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold text-white">
            Quick Actions
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <Link
              href="/teams"
              className="card block no-underline transition hover:border-yellow-400/30"
            >
              <div className="font-bold text-white">
                Manage Teams
              </div>

              <p className="muted mt-1 text-sm">
                Open your teams, rosters, and schedules.
              </p>
            </Link>

            <Link
              href="/upload"
              className="card block no-underline transition hover:border-yellow-400/30"
            >
              <div className="font-bold text-white">
                Upload Match
              </div>

              <p className="muted mt-1 text-sm">
                Upload new match footage for processing.
              </p>
            </Link>

            <Link
              href="/help"
              className="card block no-underline transition hover:border-yellow-400/30"
            >
              <div className="font-bold text-white">
                Help Center
              </div>

              <p className="muted mt-1 text-sm">
                Learn how to use InsightFC.
              </p>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
