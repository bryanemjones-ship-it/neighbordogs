import { ClientDemoCard } from "./client-demo-card";
import { SectionBand } from "./section-band";

export function ClientBookingDemo({ businessName }: { businessName: string }) {
  return (
    <SectionBand id="client-demo" tone="mint" className="scroll-mt-24">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-nd-grass">
            Client trust
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-nd-text sm:text-3xl">
            Clients see a real local business.
          </h2>
          <p className="mt-4 text-nd-text-soft">
            A clean booking page, reliable reminders, and a professional report
            after every walk — not &ldquo;software.&rdquo;
          </p>
          <ul className="mt-5 space-y-2 text-sm text-nd-text">
            {[
              "Booking + recurring walks",
              "GPS route + photos",
              "Potty/water/food checklist",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-nd-grass">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <ClientDemoCard businessName={businessName} />
      </div>
    </SectionBand>
  );
}
