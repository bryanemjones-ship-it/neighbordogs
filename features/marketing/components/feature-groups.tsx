import { PawBullet } from "./icons";

const groups = [
  {
    title: "Client trust",
    subtitle: "What dog owners see after they book",
    accent: "border-nd-collar/30 bg-nd-sky/40",
    items: [
      "Online booking",
      "Reminders",
      "GPS route proof",
      "Walk report cards",
      "Photos and visit notes",
    ],
  },
  {
    title: "Operator control",
    subtitle: "What you run from the admin side",
    accent: "border-nd-grass/30 bg-nd-grass/5",
    items: [
      "Daily schedule",
      "Client records",
      "Dog profiles",
      "Payments",
      "Recurring walks",
      "Oh Crap! same-day emergency walks",
      "Simple business records",
    ],
  },
  {
    title: "Business foundation",
    subtitle: "How you start and stay protected",
    accent: "border-nd-golden/40 bg-nd-golden/10",
    items: [
      "Protected local territory",
      "Territory preview",
      "One operator per area",
      "$149/month",
      "No contract",
      "No franchise fee",
      "No percentage of walks",
    ],
  },
];

export function FeatureGroups() {
  return (
    <section id="features" className="mt-16 scroll-mt-24">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold tracking-tight text-nd-text sm:text-3xl">
          The real app is already there.
        </h2>
        <p className="mt-3 text-nd-text-soft">
          Client booking, GPS walk tracking, report cards, photos, payments,
          reminders, and admin tools — the full platform from the NeighborDogs
          prototype, not a concept deck.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {groups.map((group) => (
          <div
            key={group.title}
            className={`nd-glass rounded-nd-lg p-6 ${group.accent}`}
          >
            <h3 className="text-lg font-bold text-nd-text">{group.title}</h3>
            <p className="mt-1 text-xs font-medium text-nd-text-soft">
              {group.subtitle}
            </p>
            <ul className="mt-5 space-y-2.5">
              {group.items.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm text-nd-text"
                >
                  <PawBullet className="mt-0.5 text-nd-golden-deep" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
