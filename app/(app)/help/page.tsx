import Link from "next/link";

const gettingStarted = [
  {
    number: "01",
    title: "Create your team",
    text: "Set up the team you want to track in InsightFC. Each team gets its own roster, schedule, match history, and performance workspace.",
    link: "/teams",
    linkText: "Go to Teams",
  },
  {
    number: "02",
    title: "Build your roster",
    text: "Add your players with their jersey number, birth year, position, and primary foot. Players can be marked Active, Guest, or Inactive.",
    link: "/teams",
    linkText: "Choose a team",
  },
  {
    number: "03",
    title: "Add your matches",
    text: "Use your team schedule to organize upcoming matches. When match video is ready, upload it to InsightFC for analysis.",
    link: "/upload",
    linkText: "Upload a Match",
  },
  {
    number: "04",
    title: "Review development",
    text: "As match analysis becomes available, your team and player pages will begin filling with performance data and development insights.",
    link: "/",
    linkText: "View Overview",
  },
];

const faqs = [
  {
    question: "When will my team statistics appear?",
    answer:
      "New teams begin with an empty performance dashboard. Statistics will populate as match video is analyzed and match data becomes available.",
  },
  {
    question: "What is an Active player?",
    answer:
      "Active players are part of your current roster and are included in the active player count on your team dashboard.",
  },
  {
    question: "What is a Guest player?",
    answer:
      "Guest status is useful for players participating with your team temporarily without being part of the regular active roster.",
  },
  {
    question: "What happens when I mark a player Inactive?",
    answer:
      "The player remains associated with the team but is separated from the current active and guest rosters.",
  },
  {
    question: "Can I permanently remove a player?",
    answer:
      "Yes. Use Remove on the Players page. InsightFC requires you to type delete before permanently removing the player.",
  },
  {
    question: "Can I upload match video before statistics exist?",
    answer:
      "Yes. Uploading match video is part of building your team's performance history. Your dashboard is designed to be useful even before your first analyzed match.",
  },
];

export default function HelpPage() {
  return (
    <div className="space-y-8">
      <header>
        <div className="eyebrow">InsightFC Help Center</div>

        <h1 className="page-title mt-2">Help</h1>

        <p className="muted mt-3 max-w-2xl">
          Everything you need to get your team set up, manage your
          roster, upload matches, and start using InsightFC.
        </p>
      </header>

      <section className="card">
        <div>
          <div className="eyebrow">Quick start</div>

          <h2 className="mt-2 text-xl font-bold text-white">
            Get started with InsightFC
          </h2>

          <p className="muted mt-2 max-w-2xl text-sm">
            You do not need match data to start. Build your team first,
            then InsightFC can grow with your season.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {gettingStarted.map((step) => (
            <div
              key={step.number}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-yellow-400/20 bg-yellow-400/10 text-sm font-black text-yellow-300">
                  {step.number}
                </div>

                <div>
                  <h3 className="font-bold text-white">
                    {step.title}
                  </h3>

                  <p className="muted mt-2 text-sm leading-6">
                    {step.text}
                  </p>

                  <Link
                    href={step.link}
                    className="mt-4 inline-block text-sm font-bold text-yellow-400 hover:text-yellow-300"
                  >
                    {step.linkText} →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="card">
          <div className="eyebrow">Roster</div>

          <h2 className="mt-2 text-lg font-bold text-white">
            Managing Players
          </h2>

          <p className="muted mt-3 text-sm leading-6">
            Your Players page is the home for managing the current
            roster. Add player details and move players between roster
            statuses as the season changes.
          </p>

          <div className="mt-5 space-y-3">
            <div className="rounded-xl border border-white/10 p-4">
              <p className="font-bold text-white">Active</p>
              <p className="muted mt-1 text-sm">
                Players currently on your regular roster.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 p-4">
              <p className="font-bold text-white">Guest</p>
              <p className="muted mt-1 text-sm">
                Temporary or guest players participating with the team.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 p-4">
              <p className="font-bold text-white">Inactive</p>
              <p className="muted mt-1 text-sm">
                Players you want to keep associated with the team
                without including them on the current roster.
              </p>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="eyebrow">Match video</div>

          <h2 className="mt-2 text-lg font-bold text-white">
            Uploading a Match
          </h2>

          <p className="muted mt-3 text-sm leading-6">
            Match video gives InsightFC the source material needed for
            analysis and player development data.
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <p className="font-bold text-white">
                1. Enter match details
              </p>
              <p className="muted mt-1 text-sm">
                Identify the match and provide the information requested
                on the upload page.
              </p>
            </div>

            <div>
              <p className="font-bold text-white">
                2. Select your video
              </p>
              <p className="muted mt-1 text-sm">
                Choose the match video you want associated with the
                match.
              </p>
            </div>

            <div>
              <p className="font-bold text-white">
                3. Upload and process
              </p>
              <p className="muted mt-1 text-sm">
                InsightFC securely uploads the video and moves the match
                into the processing workflow.
              </p>
            </div>
          </div>

          <Link href="/upload" className="btn-yellow mt-6">
            Upload Match
          </Link>
        </section>

        <section className="card">
          <div className="eyebrow">Performance</div>

          <h2 className="mt-2 text-lg font-bold text-white">
            Understanding Your Dashboard
          </h2>

          <p className="muted mt-3 text-sm leading-6">
            Your team overview is designed to give you one place to
            understand your season as data becomes available.
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <p className="font-bold text-white">Season Snapshot</p>
              <p className="muted mt-1 text-sm">
                A quick view of your team record and key performance
                numbers.
              </p>
            </div>

            <div>
              <p className="font-bold text-white">Upcoming Matches</p>
              <p className="muted mt-1 text-sm">
                Keeps the next fixtures visible from the team workspace.
              </p>
            </div>

            <div>
              <p className="font-bold text-white">Player Leaders</p>
              <p className="muted mt-1 text-sm">
                Player performance areas will populate as analyzed match
                data becomes available.
              </p>
            </div>

            <div>
              <p className="font-bold text-white">Recent Matches</p>
              <p className="muted mt-1 text-sm">
                Your analyzed match history will live here as the season
                develops.
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className="card">
        <div className="eyebrow">FAQ</div>

        <h2 className="mt-2 text-xl font-bold text-white">
          Frequently Asked Questions
        </h2>

        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-xl border border-white/10 bg-white/[0.02] p-5"
            >
              <summary className="cursor-pointer list-none font-bold text-white">
                <div className="flex items-center justify-between gap-4">
                  <span>{faq.question}</span>
                  <span className="text-xl text-yellow-400 transition-transform group-open:rotate-45">
                    +
                  </span>
                </div>
              </summary>

              <p className="muted mt-4 text-sm leading-6">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-yellow-400/20 bg-yellow-400/[0.05] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="eyebrow">Need more help?</div>

            <h2 className="mt-2 text-xl font-bold text-white">
              We're still building InsightFC.
            </h2>

            <p className="muted mt-2 max-w-2xl text-sm">
              This Help Center will continue growing as new features are
              added. For now, start with your team, roster, and first
              match.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/teams" className="btn-ghost">
              My Teams
            </Link>

            <Link href="/upload" className="btn-yellow">
              Upload Match
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
