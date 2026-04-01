// app/(app)/teams/create/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type CreateTeamPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function CreateTeamPage({
  searchParams,
}: CreateTeamPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const errorMessage = params?.error ?? "";

  async function createTeam(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      redirect("/login");
    }

    const name = String(formData.get("name") ?? "").trim();

    if (!name) {
      redirect("/teams/create?error=Please enter a team name");
    }

    const { data, error } = await supabase
      .from("teams")
      .insert({
        name,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Create team error:", error);
      redirect(`/teams/create?error=${encodeURIComponent(error.message)}`);
    }

    if (!data?.id) {
      redirect("/teams/create?error=Team was not created correctly");
    }

    redirect(`/teams/${data.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6">
        <Link href="/teams" className="text-sm text-white/70 hover:text-white">
          ← Back to Teams
        </Link>
      </div>

      <h1 className="text-3xl font-bold">Create Team</h1>
      <p className="mt-2 text-sm text-white/70">
        Add a new team to InsightFC.
      </p>

      {errorMessage ? (
        <div className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorMessage}
        </div>
      ) : null}

      <form
        action={createTeam}
        className="mt-8 space-y-6 rounded-2xl border border-white/10 p-6"
      >
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium">
            Team Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="2015 Boys Pre-Elite"
            required
            className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none"
          />
        </div>

        <button
          type="submit"
          className="rounded-xl bg-yellow-400 px-5 py-3 font-semibold text-black"
        >
          Create Team
        </button>
      </form>
    </div>
  );
}