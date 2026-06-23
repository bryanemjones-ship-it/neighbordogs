import { PawBullet } from "./icons";

const operations = [
  "Territory preview",
  "Client booking page",
  "Walk scheduling",
  "Payments and reminders",
  "Dog profiles",
  "Visit notes",
  "Walk reports and photos",
  "Simple business records",
];

export function OperationsSection() {
  return (
    <section className="mt-14 rounded-nd-lg border border-nd-border bg-nd-card-cream/80 p-7 sm:p-10">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-nd-text sm:text-3xl">
            Loving dogs is the easy part.
          </h2>
          <p className="mt-4 leading-relaxed text-nd-text-soft">
            The hard part is the calendar, the payments, the reminders, the
            client notes, and the follow-up. NeighborDogs keeps that part from
            turning into a mess.
          </p>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2">
          {operations.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2.5 rounded-xl border border-nd-border/80 bg-white/50 px-3 py-2.5 text-sm text-nd-text-soft"
            >
              <PawBullet className="mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function LocalOperatorSection() {
  return (
    <section className="mt-14 border-y border-nd-border py-10 sm:py-12">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-bold tracking-tight text-nd-text sm:text-3xl">
          Built for one good local operator.
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-nd-text-soft">
          Most neighborhoods do not need a national brand. They need someone
          nearby, reliable, and easy to book. Whether this is your first real
          business or your next chapter, NeighborDogs gives you a system that
          keeps things organized.
        </p>
      </div>
    </section>
  );
}
