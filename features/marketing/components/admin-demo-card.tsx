function MockAdminPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-nd-border bg-nd-card-cream shadow-lg">
      <div className="flex items-center justify-between border-b border-nd-border bg-nd-text px-3 py-2">
        <span className="text-[10px] font-semibold text-nd-card-cream">
          Operator dashboard
        </span>
        <span className="rounded-full bg-nd-grass/25 px-2 py-0.5 text-[9px] font-medium text-nd-grass">
          Today
        </span>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-[1fr_1.2fr]">{children}</div>
    </div>
  );
}

function ScheduleItem({
  time,
  dog,
  status,
  gps,
}: {
  time: string;
  dog: string;
  status: string;
  gps?: boolean;
}) {
  const statusColor =
    status === "Complete"
      ? "bg-nd-grass/15 text-nd-grass"
      : status === "In progress"
        ? "bg-nd-collar/15 text-nd-collar"
        : "bg-nd-golden/15 text-nd-golden-deep";

  return (
    <div className="flex items-center justify-between rounded-lg border border-nd-border bg-white/70 px-2.5 py-2 text-[10px]">
      <div>
        <p className="font-semibold text-nd-text">{time}</p>
        <p className="text-nd-text-soft">{dog}</p>
      </div>
      <div className="flex items-center gap-1.5">
        {gps ? (
          <span className="rounded bg-nd-collar/15 px-1.5 py-0.5 text-[8px] font-bold text-nd-collar">
            GPS
          </span>
        ) : null}
        <span className={`rounded-full px-2 py-0.5 font-medium ${statusColor}`}>
          {status}
        </span>
      </div>
    </div>
  );
}

export function AdminDemoCard() {
  return (
    <MockAdminPanel>
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-nd-text-soft">
          Today&apos;s schedule
        </p>
        <ScheduleItem time="9:00 AM" dog="Biscuit · Martin" status="Complete" />
        <ScheduleItem
          time="11:30 AM"
          dog="Cooper · Lee"
          status="In progress"
          gps
        />
        <ScheduleItem time="2:00 PM" dog="Mochi · Park" status="Upcoming" />

        <p className="pt-2 text-[10px] font-semibold uppercase tracking-wide text-nd-text-soft">
          Client list · dog profiles
        </p>
        <div className="space-y-1">
          {[
            "Martin · Biscuit + Scout",
            "Lee · Cooper · recurring",
            "Park · Mochi · new",
          ].map((c) => (
            <div
              key={c}
              className="rounded border border-nd-border bg-white/50 px-2 py-1 text-[10px] text-nd-text-soft"
            >
              {c}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-nd-text-soft">
          Active walk
        </p>
        <div className="rounded-lg border border-nd-border bg-white/70 p-2.5">
          <div className="flex justify-between text-[10px]">
            <span className="font-medium text-nd-text">Cooper · 30 min</span>
            <span className="font-medium text-nd-grass">Paid</span>
          </div>
          <div className="mt-2 h-10 rounded border border-dashed border-nd-collar/30 bg-nd-sky/50" />
          <p className="mt-1 text-[9px] text-nd-text-soft">
            GPS tracking · route notes saved
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1.5 text-[9px]">
          {[
            "Reminders sent",
            "Report card",
            "Client update",
            "Records",
          ].map((item) => (
            <div
              key={item}
              className="rounded border border-nd-border bg-nd-grass/10 px-2 py-1.5 text-center font-medium text-nd-text"
            >
              {item}
            </div>
          ))}
        </div>

        <div className="rounded border border-nd-border bg-nd-golden/8 px-2.5 py-2 text-[9px] text-nd-text-soft">
          <span className="font-semibold text-nd-text">Route note:</span> Left
          fresh water by back door. Client notified.
        </div>
      </div>
    </MockAdminPanel>
  );
}
