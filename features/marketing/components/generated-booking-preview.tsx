import { DogTagIcon } from "./icons";

type GeneratedBookingPreviewProps = {
  businessName: string;
  compact?: boolean;
};

function PreviewContent({
  businessName,
  compact,
}: GeneratedBookingPreviewProps) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p
            className={`font-bold text-nd-text ${compact ? "text-sm" : "text-base"}`}
          >
            {businessName}
          </p>
          <p className="text-[10px] text-nd-text-soft">
            Your neighborhood · Local service area
          </p>
        </div>
        <DogTagIcon className="h-7 w-5 shrink-0 opacity-90" />
      </div>

      <span className="inline-flex items-center gap-1 rounded-full border border-nd-grass/30 bg-nd-grass/10 px-2.5 py-1 text-[10px] font-semibold text-nd-grass">
        Insured local dog walking
      </span>

      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-nd-text-soft">
          Choose a walk
        </p>
        <div className="flex flex-wrap gap-1.5">
          {["20 min", "30 min", "60 min"].map((len, i) => (
            <span
              key={len}
              className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                i === 1
                  ? "bg-nd-grass text-white"
                  : "border border-nd-border bg-white/70 text-nd-text-soft"
              }`}
            >
              {len}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-nd-border bg-white/60 px-3 py-2 text-[10px]">
        <span className="text-nd-text-soft">Recurring walks</span>
        <span className="float-right font-medium text-nd-text">
          Tue & Thu
        </span>
      </div>

      <div className="rounded-lg border border-nd-grass/25 bg-nd-grass/8 px-3 py-2 text-[10px]">
        <span className="font-medium text-nd-text">Select dog</span>
        <span className="float-right text-nd-text-soft">Buddy</span>
      </div>

      <p className="text-[10px] text-nd-text-soft">
        Payment ready · card on file for easy checkout
      </p>

      <button
        type="button"
        tabIndex={-1}
        className="w-full rounded-full bg-nd-grass py-2 text-xs font-semibold text-white"
      >
        Book a Walk
      </button>

      <div className="rounded-lg border border-nd-grass/20 bg-nd-grass/5 px-3 py-2 text-[10px] text-nd-text">
        <span className="font-semibold text-nd-grass">Confirmed</span>
        <span className="text-nd-text-soft">
          {" "}
          · Reminder scheduled before each walk
        </span>
      </div>

      <div className="rounded-xl border border-nd-border bg-nd-sky/35 p-3">
        <p className="text-[10px] font-semibold text-nd-collar">
          Walk report preview
        </p>
        <div
          className={`mt-2 rounded-lg border border-dashed border-nd-collar/35 bg-white/50 ${compact ? "h-8" : "h-10"}`}
        />
        <p className="mt-1 text-[9px] text-nd-text-soft">GPS route preview</p>
        <div className="mt-2 flex gap-1">
          <div
            className={`rounded bg-nd-golden/30 ${compact ? "h-6 w-6" : "h-7 w-7"}`}
          />
          <div
            className={`rounded bg-nd-golden/30 ${compact ? "h-6 w-6" : "h-7 w-7"}`}
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {(compact
            ? ["Pee ✓", "Poop ✓", "Water ✓"]
            : ["Pee ✓", "Water ✓", "Food ✓"]
          ).map((t) => (
            <span
              key={t}
              className="rounded bg-white/80 px-1.5 py-0.5 text-[9px] text-nd-text-soft"
            >
              {t}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[10px] italic text-nd-text-soft">
          Walker note: &ldquo;Great walk today.&rdquo;
        </p>
      </div>
    </>
  );
}

export function GeneratedBookingPreview({
  businessName,
  variant,
}: GeneratedBookingPreviewProps & { variant: "mobile" | "desktop" }) {
  if (variant === "mobile") {
    return (
      <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-[1.75rem] border-[3px] border-nd-border bg-nd-card-cream shadow-md">
        <div className="bg-nd-collar/85 px-4 py-1.5 text-center text-[9px] text-nd-card-cream">
          Mobile preview
        </div>
        <div className="max-h-[420px] space-y-3 overflow-y-auto p-4">
          <PreviewContent businessName={businessName} compact />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-nd-lg border-2 border-nd-border bg-nd-card-cream shadow-lg">
      <div className="flex items-center gap-2 border-b border-nd-border bg-white/80 px-4 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-nd-heart/50" />
        <span className="h-2.5 w-2.5 rounded-full bg-nd-golden/50" />
        <span className="h-2.5 w-2.5 rounded-full bg-nd-grass/50" />
        <span className="ml-2 text-[10px] font-medium text-nd-text-soft">
          Desktop preview
        </span>
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-2">
        <div className="space-y-3">
          <PreviewContent businessName={businessName} />
        </div>
        <div className="rounded-xl border border-nd-border bg-nd-sky/30 p-3">
          <p className="text-[10px] font-semibold text-nd-collar">
            After the walk — report card
          </p>
          <div className="nd-route-line mt-2 h-1 w-full rounded-full opacity-40" />
          <div className="mt-3 h-16 rounded-lg border border-dashed border-nd-collar/35 bg-white/50" />
          <p className="mt-1 text-[9px] text-nd-text-soft">GPS route preview</p>
          <div className="mt-2 flex gap-1">
            <div className="h-8 w-8 rounded bg-nd-golden/30" />
            <div className="h-8 w-8 rounded bg-nd-golden/30" />
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {["Pee ✓", "Poop ✓", "Water ✓"].map((t) => (
              <span
                key={t}
                className="rounded bg-white/80 px-1.5 py-0.5 text-[9px] text-nd-text-soft"
              >
                {t}
              </span>
            ))}
          </div>
          <p className="mt-2 text-[10px] italic text-nd-text-soft">
            Walker note sent to client
          </p>
        </div>
      </div>
    </div>
  );
}
