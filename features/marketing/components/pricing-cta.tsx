import { TerritoryCta } from "@/features/territory/components/territory-cta";

const pricingBullets = [
  "Protected territory while active",
  "Client booking page",
  "Schedule, payments, reminders",
  "GPS walk reports",
  "No franchise fee",
  "No cut of your walks",
  "Cancel anytime",
];

export function PricingCTA() {
  return (
    <section id="pricing" className="scroll-mt-24">
      <div className="overflow-hidden rounded-2xl border-2 border-nd-grass bg-nd-mint/30 p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-nd-text sm:text-3xl">
              One territory. One price.{" "}
              <span className="text-nd-grass">No contract.</span>
            </h2>
            <p className="mt-4 text-5xl font-bold text-nd-golden">
              $149
              <span className="text-xl font-semibold text-nd-text-soft">
                /month
              </span>
            </p>
            <ul className="mt-5 grid gap-1.5 sm:grid-cols-2">
              {pricingBullets.map((item) => (
                <li
                  key={item}
                  className="flex gap-2 text-sm text-nd-text before:font-bold before:text-nd-grass before:content-['✓']"
                >
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-nd-text-soft">
              Your territory can reopen after cancellation.
            </p>
          </div>
          <TerritoryCta className="w-full shrink-0 sm:w-auto lg:min-w-[220px]" />
        </div>
      </div>
    </section>
  );
}
