import { EmergencyBeaconIcon } from "./emergency-beacon-icon";

const featureCards = [
  {
    title: "Same-day request",
    body: "Returning clients can request help when they cannot get home in time.",
  },
  {
    title: "Premium walk",
    body: "Priced higher because it solves an urgent problem.",
  },
  {
    title: "Built-in trust",
    body: "Clients remember who helped when the day went sideways.",
  },
  {
    title: "Extra revenue",
    body: "4 walks/week × $50 ≈ $800/month gross.",
  },
];

export function OhCrapSection() {
  return (
    <section id="oh-crap" className="relative mt-14 scroll-mt-24">
      <div className="relative left-1/2 -ml-[50vw] w-screen border-y border-nd-coral/25 bg-gradient-to-r from-nd-peach/30 via-nd-card-cream to-nd-peach/20 py-10 sm:py-12">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1fr_260px] lg:items-start">
            <div>
              <div className="flex items-center gap-3">
                <EmergencyBeaconIcon />
                <span className="rounded-full border border-nd-coral/40 bg-nd-coral/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-nd-coral">
                  Same-day rescue walk
                </span>
              </div>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-nd-text sm:text-3xl">
                The walk clients remember.
              </h2>
              <p className="mt-3 max-w-xl text-nd-text-soft">
                Stuck at work? Meeting ran late?{" "}
                <strong className="text-nd-text">Oh Crap!</strong> gives
                returning clients a same-day walk when the day goes sideways.
              </p>
              <p className="mt-4 max-w-xl font-medium text-nd-text">
                Four emergency walks a week at $50 each adds about $800/month
                gross on a simple 4-week view.
              </p>
              <p className="mt-2 text-xs text-nd-text-soft">
                Example only. Availability, pricing, and demand vary by market.
              </p>

              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {featureCards.map((card) => (
                  <div
                    key={card.title}
                    className="rounded-xl border border-nd-coral/15 bg-nd-card-cream/70 px-3 py-2.5"
                  >
                    <p className="text-sm font-semibold text-nd-text">
                      {card.title}
                    </p>
                    <p className="text-xs text-nd-text-soft">{card.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border-2 border-nd-coral/40 bg-nd-card-cream p-5 shadow-md shadow-nd-coral/10">
              <div className="flex items-start gap-2">
                <EmergencyBeaconIcon className="h-8 w-8" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-nd-coral">
                    Oh Crap! Emergency Walk
                  </p>
                  <p className="mt-1 text-xs text-nd-text-soft">
                    Same-day help for returning clients
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm text-nd-text-soft">
                20 min · Same-day · Returning clients only
              </p>
              <p className="mt-3 text-3xl font-bold text-nd-golden">
                $50
                <span className="ml-1 text-sm font-medium text-nd-text-soft">
                  / one dog
                </span>
              </p>
              <p className="text-xs text-nd-text-soft">Additional dog option</p>
              <button
                type="button"
                tabIndex={-1}
                className="mt-4 w-full rounded-full bg-nd-golden py-2.5 text-sm font-bold text-white"
              >
                Request emergency walk
              </button>
              <p className="mt-2 text-center text-[10px] text-nd-text-soft">
                Static preview
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
