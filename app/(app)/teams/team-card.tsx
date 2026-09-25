"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Team = {
  id: string;
  name: string | null;
  season?: string | null;
};

export default function TeamCard({ team }: { team: Team }) {
  const router = useRouter();

  const [showDelete, setShowDelete] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const canDelete = confirmation === "delete";

  function openDeleteModal() {
    setConfirmation("");
    setError("");
    setShowDelete(true);
  }

  function closeDeleteModal() {
    if (deleting) return;

    setShowDelete(false);
    setConfirmation("");
    setError("");
  }

  async function deleteTeam() {
    if (!canDelete || deleting) return;

    setDeleting(true);
    setError("");

    try {
      const response = await fetch("/api/teams", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamId: team.id,
          confirmation,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(
          result.error || "Unable to delete this team."
        );
      }

      setShowDelete(false);
      setConfirmation("");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete this team."
      );

      setDeleting(false);
    }
  }

  return (
    <>
      <div className="card relative flex min-h-[230px] flex-col transition hover:-translate-y-0.5 hover:border-yellow-400/30">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-yellow-400/10 text-lg font-black text-yellow-400">
            {(team.name || "T").slice(0, 2).toUpperCase()}
          </div>

          <button
            type="button"
            onClick={openDeleteModal}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs font-bold text-zinc-500 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
          >
            Delete
          </button>
        </div>

        <Link
          href={`/teams/${team.id}`}
          className="group flex flex-1 flex-col no-underline"
        >
          <h2 className="text-xl font-bold text-white transition group-hover:text-yellow-400">
            {team.name || "Untitled team"}
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            {team.season || "Season not set"}
          </p>

          <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <span>Open team workspace</span>

            <span className="text-zinc-600 transition group-hover:text-yellow-400">
              ↗
            </span>
          </div>
        </Link>
      </div>

      {showDelete && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-5 py-10 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDeleteModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-team-title"
            className="w-full max-w-md rounded-3xl border border-red-500/20 bg-[#0b0b0c] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.8)] sm:p-7"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-xl font-black text-red-400">
              !
            </div>

            <h2
              id="delete-team-title"
              className="text-2xl font-black text-white"
            >
              Delete {team.name || "this team"}?
            </h2>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              This permanently removes the team from InsightFC.
              This action cannot be undone.
            </p>

            <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/[0.06] p-4">
              <div className="text-sm font-bold text-red-300">
                Permanent action
              </div>

              <p className="mt-1 text-xs leading-5 text-zinc-400">
                Do not delete a team simply because its season has
                ended. Historical teams can remain in InsightFC for
                past match and player records.
              </p>
            </div>

            <label className="mt-6 block">
              <span className="block text-sm font-semibold text-zinc-300">
                Type{" "}
                <span className="font-black text-white">
                  delete
                </span>{" "}
                to confirm
              </span>

              <input
                type="text"
                value={confirmation}
                disabled={deleting}
                autoComplete="off"
                spellCheck={false}
                onChange={(event) => {
                  setConfirmation(event.target.value);
                  setError("");
                }}
                placeholder="delete"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10 disabled:opacity-50"
              />
            </label>

            {error && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-zinc-300 transition hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={deleteTeam}
                disabled={!canDelete || deleting}
                className="rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-600"
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>

            {!canDelete && (
              <p className="mt-3 text-center text-xs text-zinc-600">
                Confirm Delete will unlock after you type delete.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
