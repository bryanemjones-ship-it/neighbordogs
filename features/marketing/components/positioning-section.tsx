const cards = [
  {
    title: "Your clients",
    body: "Build a local book of business. They book you — not a marketplace listing.",
    accent: "bg-nd-sky/60",
  },
  {
    title: "Your territory",
    body: "One operator per area. A protected neighborhood you can grow into.",
    accent: "bg-nd-golden/15",
  },
  {
    title: "Your schedule",
    body: "Walks, payments, reminders, and reports — organized without the mess.",
    accent: "bg-nd-grass/10",
  },
];

export function PositioningSection() {
  return (
    <section className="mt-14">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold tracking-tight text-nd-text sm:text-3xl">
          Not Rover. Not a franchise.
        </h2>
        <p className="mt-4 leading-relaxed text-nd-text-soft">
          Rover puts you inside a marketplace. Franchises ask for a big
          commitment. NeighborDogs helps you build your own local book of
          business with a protected area and the tools to run it.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`rounded-nd-lg border border-nd-border p-5 ${card.accent}`}
          >
            <h3 className="font-bold text-nd-text">{card.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-nd-text-soft">
              {card.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
