import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

export default async function CreateTeamPage() {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If you're not logged in, send them to login
  if (!session) redirect("/login");

  async function createTeam(formData: FormData) {
    "use server";

    const name = String(formData.get("name") ?? "").trim();
    const season = String(formData.get("season") ?? "").trim();

    if (!name || !season) return;

    const supabaseServer = createServerComponentClient({ cookies });

    const { error } = await supabaseServer
      .from("teams")
      .insert([{ name, season }]);

    if (error) {
      // This will show up in Vercel logs if it fails
      console.error("Create team error:", error);
      throw new Error(error.message);
    }

    redirect("/teams");
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="text-3xl font-bold mb-2">Create Team</h1>
      <p className="text-white/70 mb-6">
        Create a team, then schedule games and tag events.
      </p>

      <form action={createTeam} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Team name</label>
          <input
            name="name"
            className="w-full rounded-md border border-white/20 bg-black px-3 py-2"
            placeholder="2016G Pre-GAA"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Season</label>
          <input
            name="season"
            className="w-full rounded-md border border-white/20 bg-black px-3 py-2"
            placeholder="Spring 2026"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-md border border-white/20 bg-white/10 py-2 font-semibold"
        >
          Create Team
        </button>
      </form>
    </div>
  );
}