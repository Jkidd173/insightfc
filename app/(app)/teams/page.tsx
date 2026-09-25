import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TeamCard from "./team-card";

type TeamRow = {
  id: string;
  name: string | null;
  season?: string | null;
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

  const { data: teams, error } = await supabase
    .from("teams")
    .select("id,name,season,created_at")
    .order("created_at", { ascending: false });

  const teamList = (teams ?? []) as TeamRow[];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="eyebrow">Club workspace</div>

          <h1 className="page-title mt-2">Your teams</h1>

          <p className="muted mt-2 max-w-xl">
            Manage rosters, matches and player development from one
            place.
          </p>
        </div>

        <Link href="/teams/create" className="btn-yellow">
          + Add team
        </Link>
      </header>

      {error ? (
        <div className="card border-red-500/20 text-red-300">
          We couldn&apos;t load your teams. Please try again.
        </div>
      ) : null}

      {!error && teamList.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {teamList.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      ) : null}

      {!error && teamList.length === 0 ? (
        <div className="card py-14 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-yellow-400/10 text-yellow-400">
            ＋
          </div>

          <h2 className="text-xl font-bold">
            Build your first roster
          </h2>

          <p className="muted mx-auto mt-2 max-w-md">
            Add a team to begin scheduling matches, adding players and
            tracking development.
          </p>

          <Link href="/teams/create" className="btn-yellow mt-6">
            Create team
          </Link>
        </div>
      ) : null}
    </div>
  );
}
