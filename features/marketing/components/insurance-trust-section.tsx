const badges = [
  "General liability insurance required",
  "GPS walk reports",
  "Easy online booking",
  "No contract",
];

export function InsuranceTrustSection() {
  return (
    <section id="insurance" className="scroll-mt-24">
      <h2 className="text-lg font-bold text-nd-text">
        Professional from day one.
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-nd-text-soft">
        Your booking page, reminders, GPS walk reports, and client updates help
        you look organized from the first walk. Before serving clients,
        subscribers must carry their own general liability insurance.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {badges.map((badge) => (
          <span
            key={badge}
            className="rounded-full border border-nd-grass/25 bg-nd-mint/40 px-3 py-1 text-[11px] font-semibold text-nd-text"
          >
            {badge}
          </span>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-nd-text-soft">
        NeighborDogs does not provide insurance. Coverage requirements may vary
        by location.
      </p>
    </section>
  );
}
