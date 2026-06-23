function MockPhone({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-nd-border bg-nd-card-cream shadow-lg">
      <div className="flex items-center gap-1.5 border-b border-nd-border bg-white/80 px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-nd-heart/60" />
        <span className="h-2 w-2 rounded-full bg-nd-golden/60" />
        <span className="h-2 w-2 rounded-full bg-nd-grass/60" />
        <span className="ml-2 text-[10px] font-medium text-nd-text-soft">
          Client booking page
        </span>
      </div>
      <div className="space-y-3 p-4">{children}</div>
    </div>
  );
}

function MockRow({
  label,
  value,
  active,
}: {
  label: string;
  value?: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
        active
          ? "border-nd-grass bg-nd-grass/10 font-medium text-nd-text"
          : "border-nd-border bg-white/60 text-nd-text-soft"
      }`}
    >
      <span>{label}</span>
      {value ? <span className="text-nd-text">{value}</span> : null}
    </div>
  );
}

export function ClientDemoCard({ businessName }: { businessName: string }) {
  return (
    <MockPhone>
      <div>
        <p className="text-sm font-bold text-nd-text">{businessName}</p>
        <p className="text-[10px] text-nd-text-soft">
          Your neighborhood · Book online
        </p>
      </div>

      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-nd-text-soft">
          Walk length
        </p>
        <div className="flex gap-1.5">
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

      <MockRow label="Select dog" value="Biscuit" active />
      <MockRow label="Recurring walks" value="Tue & Thu" />
      <MockRow label="Payment" value="Saved" active />

      <button
        type="button"
        className="w-full rounded-full bg-nd-grass py-2 text-xs font-semibold text-white"
        tabIndex={-1}
      >
        Request walk
      </button>

      <div className="rounded-lg border border-nd-grass/25 bg-nd-grass/8 px-3 py-2 text-[10px] text-nd-text">
        <span className="font-semibold text-nd-grass">Confirmed</span>
        <span className="text-nd-text-soft">
          {" "}
          · Reminder set for tomorrow 10:30 AM
        </span>
      </div>

      <div className="rounded-xl border border-nd-border bg-nd-sky/40 p-3">
        <p className="text-[10px] font-semibold text-nd-collar">
          Walk report card · delivered
        </p>
        <div className="mt-2 h-11 rounded-lg border border-dashed border-nd-collar/40 bg-white/50" />
        <p className="mt-1 text-[9px] text-nd-text-soft">GPS route preview</p>
        <div className="mt-2 flex gap-1">
          <div className="h-8 w-8 rounded bg-nd-golden/30" />
          <div className="h-8 w-8 rounded bg-nd-golden/30" />
        </div>
        <p className="mt-2 text-[9px] font-semibold uppercase tracking-wide text-nd-text-soft">
          Visit checklist
        </p>
        <div className="mt-1 flex flex-wrap gap-1">
          {["Pee", "Poop", "Water", "Food"].map((c) => (
            <span
              key={c}
              className="rounded bg-white/80 px-1.5 py-0.5 text-[9px] text-nd-text"
            >
              {c} ✓
            </span>
          ))}
        </div>
        <p className="mt-2 text-[10px] italic text-nd-text-soft">
          Walker note: &ldquo;Great walk — Biscuit was all smiles.&rdquo;
        </p>
        <p className="mt-2 rounded bg-white/60 px-2 py-1 text-[9px] text-nd-collar">
          Client update sent · report ready to view
        </p>
      </div>
    </MockPhone>
  );
}
