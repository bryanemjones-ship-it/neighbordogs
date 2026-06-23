const scheduleItems = [
  {
    time: "8:30 AM",
    dog: "Milo",
    detail: "30 min walk",
    chip: "Paid",
    chipClass: "bg-nd-grass/15 text-nd-grass",
    note: "Milo pulls near squirrels",
  },
  {
    time: "10:00 AM",
    dog: "Daisy",
    detail: "20 min walk",
    chip: "Report due",
    chipClass: "bg-nd-heart/15 text-nd-heart",
    note: "Daisy needs water refill",
  },
  {
    time: "12:30 PM",
    dog: "Cooper",
    detail: "60 min walk",
    chip: "GPS tracking",
    chipClass: "bg-nd-collar/15 text-nd-collar",
    note: "Cooper gets photo update",
  },
  {
    time: "3:00 PM",
    dog: "Luna",
    detail: "Recurring walk",
    chip: "Reminder sent",
    chipClass: "bg-nd-golden/15 text-nd-golden-deep",
    note: "Luna prefers side gate",
  },
];

function PhoneFrame({
  businessName,
  children,
}: {
  businessName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-[2rem] border-[3px] border-nd-collar/20 bg-nd-card-cream shadow-lg shadow-nd-collar/10">
      <div className="bg-nd-collar/90 px-4 py-2.5 text-center">
        <div className="mx-auto h-1 w-16 rounded-full bg-white/30" />
        <p className="mt-1 truncate text-xs font-semibold text-nd-card-cream">
          {businessName}
        </p>
        <p className="text-[10px] text-nd-card-cream/80">Today&apos;s route</p>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function OperatorTodayDemo({ businessName }: { businessName: string }) {
  return (
    <section id="operator-demo" className="mt-14 scroll-mt-24">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <PhoneFrame businessName={businessName}>
          <ul className="space-y-2.5">
            {scheduleItems.map((item) => (
              <li
                key={item.time}
                className="rounded-xl border border-nd-border/80 bg-white/80 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-bold text-nd-text">{item.time}</p>
                    <p className="text-sm font-semibold text-nd-text">{item.dog}</p>
                    <p className="text-[10px] text-nd-text-soft">{item.detail}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${item.chipClass}`}
                  >
                    {item.chip}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </PhoneFrame>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-nd-collar">
            Your phone-first OS
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-nd-text sm:text-3xl">
            Your day, already laid out.
          </h2>
          <p className="mt-4 text-lg text-nd-text">
            Open your phone in the morning. Your day is already laid out.
          </p>
          <p className="mt-2 font-medium text-nd-golden-deep">
            Walk the dogs. Send the reports.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["Paid", "GPS tracking", "Report due", "Reminder sent"].map(
              (label) => (
                <span
                  key={label}
                  className="rounded-full border border-nd-border bg-nd-card-cream px-2.5 py-1 text-[10px] font-semibold text-nd-text-soft"
                >
                  {label}
                </span>
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
