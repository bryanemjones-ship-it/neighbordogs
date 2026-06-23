import { SectionBand } from "./section-band";

const ladderSteps = [
  { clients: 5, label: "Early traction" },
  { clients: 15, label: "Side income" },
  { clients: 35, label: "Serious business" },
];

export function IncomeExample() {
  return (
    <SectionBand id="math" tone="butter" className="scroll-mt-24">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-nd-golden-deep">
            The money can work
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-nd-text sm:text-3xl">
            The business math is simple.
          </h2>
          <div className="mt-6 flex flex-wrap gap-4">
            {ladderSteps.map((step) => (
              <div key={step.clients} className="text-center">
                <p className="text-3xl font-bold text-nd-golden">{step.clients}</p>
                <p className="text-[11px] font-medium text-nd-text-soft">
                  clients
                </p>
                <p className="text-xs font-semibold text-nd-text">{step.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border-2 border-nd-golden/25 bg-nd-card-cream/90 p-5 sm:p-6">
          <div className="space-y-2 font-mono text-sm">
            <p className="text-nd-text-soft">35 regular clients</p>
            <p className="text-nd-text-soft">× 20 walks per month</p>
            <p className="text-nd-text-soft">× $25 per walk</p>
            <p className="border-t border-nd-border pt-3 text-xl font-bold text-nd-golden-deep">
              = $17,500/month gross
            </p>
          </div>
          <p className="mt-4 text-xs text-nd-text-soft">
            Example only. Your market, pricing, and effort matter.
          </p>
        </div>
      </div>
    </SectionBand>
  );
}
