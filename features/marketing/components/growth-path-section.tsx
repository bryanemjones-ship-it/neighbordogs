const growthCards = [
  {
    title: "Start solo",
    body: "Open your phone. See the day. Walk the dogs. Send the reports.",
  },
  {
    title: "Add walkers",
    body: "Assign walks. They see schedule, notes, and report-card steps.",
  },
  {
    title: "Build a business",
    body: "Recurring clients, documented revenue, and clean operations.",
  },
];

export function GrowthPathSection() {
  return (
    <section id="growth" className="mt-14 scroll-mt-24">
      <p className="text-sm font-semibold uppercase tracking-wide text-nd-grass">
        Grow when you are ready
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-nd-text sm:text-3xl">
        Start solo. Grow when you are ready.
      </h2>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {growthCards.map((card, i) => (
          <div key={card.title} className="relative pl-4">
            <span className="absolute left-0 top-0 text-2xl font-bold text-nd-golden/40">
              {i + 1}
            </span>
            <h3 className="font-bold text-nd-text">{card.title}</h3>
            <p className="mt-1 text-sm text-nd-text-soft">{card.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-nd-border bg-nd-sky/25 px-5 py-4 sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div>
          <p className="text-sm font-bold text-nd-text">Team math example</p>
          <p className="mt-1 text-xs text-nd-text-soft">
            25 assigned walks/week → about $1,500 before other expenses (4-week
            view)
          </p>
        </div>
        <p className="mt-2 text-xs text-nd-text-soft sm:mt-0 sm:max-w-xs">
          Operated income — not passive. Example only.
        </p>
      </div>
    </section>
  );
}
