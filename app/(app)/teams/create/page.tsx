// app/(app)/teams/create/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default function CreateTeamPage() {
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
      redirect("/teams/create?error=missing-name");
    }

    const { error } = await supabase.from("teams").insert({
      name,
    });

    if (error) {
      console.error("Create team error:", error.message);
      redirect(`/teams/create?error=${encodeURIComponent(error.message)}`);
    }

    redirect("/teams");
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-3xl font-bold">Create Team</h1>
      <p className="mt-2 text-sm text-white/70">
        Add a new team to InsightFC.
      </p>

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