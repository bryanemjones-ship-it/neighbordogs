import { DogTagIcon } from "./icons";

const statusCards = [
  { label: "Walk booked", color: "bg-nd-collar/90 text-white" },
  { label: "GPS route tracked", color: "bg-nd-grass/90 text-white" },
  { label: "Report card sent", color: "bg-nd-golden/90 text-white" },
];

export function HeroProductVisual() {
  return (
    <div className="relative mx-auto w-full max-w-sm lg:max-w-none" aria-hidden="true">
      <div className="absolute -right-2 top-0 z-10 rotate-3 rounded-xl border border-nd-border bg-nd-card-cream px-3 py-2 shadow-sm">
        <DogTagIcon className="h-8 w-6" />
      </div>

      {statusCards.map((card, i) => (
        <div
          key={card.label}
          className={`absolute z-20 max-w-[9rem] rounded-full px-3 py-1.5 text-center text-[11px] font-semibold leading-tight shadow-md ${card.color} ${
            i === 0
              ? "left-0 top-6 -rotate-6"
              : i === 1
                ? "right-0 top-[38%] rotate-2"
                : "bottom-6 left-2 -rotate-1"
          }`}
        >
          {card.label}
        </div>
      ))}

      <div className="nd-glass-warm relative mt-6 overflow-hidden rounded-nd-lg border border-nd-border p-4 sm:p-5">
        <div className="nd-route-line mb-3 h-1 w-full rounded-full opacity-50" />

        <div className="rounded-xl border border-nd-border bg-white/70 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-nd-golden">
              Walk report card
            </p>
            <span className="rounded-full bg-nd-grass/15 px-2 py-0.5 text-[9px] font-medium text-nd-grass">
              Sent to client
            </span>
          </div>
          <div className="mt-2 flex gap-2">
            <div className="h-14 flex-1 rounded-lg bg-nd-sky/80 p-1.5">
              <div className="h-full w-full rounded border border-dashed border-nd-collar/25 bg-nd-sky/60" />
              <p className="mt-0.5 text-[9px] text-nd-text-soft">GPS route</p>
            </div>
            <div className="flex flex-col gap-1">
              <div className="h-6 w-12 rounded bg-nd-peach/60" />
              <div className="h-6 w-12 rounded bg-nd-butter/70" />
            </div>
          </div>
          <div className="report-potty mt-2 flex flex-wrap gap-1.5">
            {["Pee ✓", "Poop ✓", "Water ✓", "Food ✓"].map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-nd-grass/12 px-2 py-0.5 text-[10px] font-medium text-nd-text-soft"
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-nd-text-soft">
            Walker note: &ldquo;Happy walk on Maple St.&rdquo;
          </p>
        </div>

        <svg viewBox="0 0 160 100" className="mx-auto mt-3 h-14 w-28 opacity-85">
          <circle cx="80" cy="55" r="26" fill="#E9A84A" />
          <ellipse cx="58" cy="32" rx="10" ry="12" fill="#FFD6B0" />
          <ellipse cx="102" cy="32" rx="10" ry="12" fill="#FFD6B0" />
          <circle cx="72" cy="52" r="4" fill="#2E2722" />
          <circle cx="88" cy="52" r="4" fill="#2E2722" />
          <path
            d="M50 68 Q80 78 110 68"
            stroke="#C9923F"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </div>
    </div>
  );
}
