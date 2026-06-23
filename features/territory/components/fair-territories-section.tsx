const bullets = [
  "Dense areas can use smaller territories",
  "Spread-out suburbs may need larger territories",
  "Each area is designed around similar business potential",
  "One operator per active territory",
];

type FairTerritoriesSectionProps = {
  compact?: boolean;
};

export function FairTerritoriesSection({ compact = false }: FairTerritoriesSectionProps) {
  return (
    <section
      id={compact ? undefined : "fair-territories"}
      className={compact ? "" : "mt-16 scroll-mt-24"}
    >
      <div
        className={`nd-glass-warm rounded-nd-lg border border-nd-border ${compact ? "p-6 sm:p-7" : "p-7 sm:p-10"}`}
      >
        <h2
          className={`font-bold tracking-tight text-nd-text ${compact ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"}`}
        >
          Fair territories, not random circles.
        </h2>
        <p className="mt-4 max-w-3xl leading-relaxed text-nd-text-soft">
          A mile in Manhattan is not the same as a mile in suburban Oklahoma.
          NeighborDogs uses local housing and population data to shape
          territories around comparable opportunity, not just distance on a map.
        </p>
        {!compact ? (
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-nd-text-soft">
            We use census and housing data to estimate opportunity, then shape
            the territory around the market — not just a fixed radius.
          </p>
        ) : null}

        <ul className={`grid gap-2 ${compact ? "mt-4 sm:grid-cols-2" : "mt-6 sm:grid-cols-2"}`}>
          {bullets.map((item) => (
            <li
              key={item}
              className="flex gap-2 rounded-lg border border-nd-border bg-nd-card-cream/80 px-3 py-2.5 text-sm text-nd-text"
            >
              <span className="font-bold text-nd-collar">✓</span>
              {item}
            </li>
          ))}
        </ul>

        <p className="mt-5 text-xs leading-relaxed text-nd-text-soft">
          Approximate opportunity only. Territories are designed around estimated
          market potential — not a promise of equal income or perfect fairness.
        </p>
      </div>
    </section>
  );
}
