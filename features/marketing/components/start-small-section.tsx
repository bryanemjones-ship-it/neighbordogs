import { RouteMapMotif } from "./icons";

export function StartSmallSection() {
  return (
    <section className="mt-14 overflow-hidden rounded-nd-lg border border-nd-border bg-gradient-to-r from-nd-golden/10 via-nd-card-cream to-nd-card-cream p-7 sm:p-10">
      <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-nd-golden-deep">
            Start small
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-nd-text sm:text-3xl">
            Start with one route.
          </h2>
          <p className="mt-4 leading-relaxed text-nd-text-soft">
            You do not need a storefront, a franchise, or a giant launch. Start
            with a neighborhood. Build a regular client list. Keep the schedule
            tight. Let the system handle the details.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-nd-text-soft">
            Whether you are in school, between jobs, or ready for something of
            your own — this is a real way to get started without getting
            overwhelmed.
          </p>
        </div>
        <RouteMapMotif className="hidden w-48 opacity-80 lg:block" />
      </div>
    </section>
  );
}
