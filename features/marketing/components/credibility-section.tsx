import { PawBullet } from "./icons";

const credibilityItems = [
  "Your own booking page",
  "Client and dog profiles",
  "Walk schedule",
  "Payment collection",
  "Visit notes and reports",
  "Reminder messages",
  "Simple business records",
];

export function CredibilitySection() {
  return (
    <section className="mt-14">
      <div className="max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-nd-collar">
          Credible from day one
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-nd-text sm:text-3xl">
          Look professional from day one.
        </h2>
        <p className="mt-3 text-nd-text-soft">
          Booking page, schedule, payments, reminders, and dog notes — already
          handled. Something you can show a parent, partner, or friend and have
          it make sense.
        </p>
      </div>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {credibilityItems.map((item) => (
          <li
            key={item}
            className="nd-glass flex items-start gap-3 rounded-nd border border-nd-border px-4 py-3.5 text-sm text-nd-text"
          >
            <PawBullet className="mt-0.5 text-nd-grass" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
