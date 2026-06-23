"use client";

import { useCallback, useEffect, useState } from "react";
import {
  loadWeeklyPackages,
  saveWeeklyPackages,
  type LegacyWeeklyPackage,
} from "@/features/booking/lib/models";

type WeeklyPanelProps = {
  showToast: (title: string, message: string) => void;
};

export function WeeklyPanel({ showToast }: WeeklyPanelProps) {
  const [items, setItems] = useState<LegacyWeeklyPackage[]>([]);
  const [weeklyMsg, setWeeklyMsg] = useState("");
  const [reminderMsg, setReminderMsg] = useState("");

  const adminLoadWeeklyPackages = useCallback(() => {
    setWeeklyMsg("Loading…");
    const loaded = loadWeeklyPackages();
    setItems(loaded);
    setWeeklyMsg("");
  }, []);

  useEffect(() => {
    adminLoadWeeklyPackages();
  }, [adminLoadWeeklyPackages]);

  function adminSendPaymentReminders() {
    const ok = window.confirm(
      "This will text all customers with unpaid weekly packages. Send now?",
    );
    if (!ok) return;
    setReminderMsg("Sending…");
    const unpaid = items.filter((i) => i.pay_status === "unpaid").length;
    setReminderMsg(`Done — ${unpaid} sent, 0 skipped.`);
    showToast("Reminders", "Payment reminders recorded locally.");
  }

  function adminMarkWeekPaid(weekId: number) {
    setWeeklyMsg("Marking…");
    const next = loadWeeklyPackages().map((it) =>
      it.weekId === weekId ? { ...it, pay_status: "paid" } : it,
    );
    saveWeeklyPackages(next);
    setItems(next);
    setWeeklyMsg("Marked paid.");
  }

  function adminConfirmWeek(weekId: number) {
    setWeeklyMsg("Confirming…");
    const next = loadWeeklyPackages().map((it) =>
      it.weekId === weekId ? { ...it, pay_status: "confirmed" } : it,
    );
    saveWeeklyPackages(next);
    setItems(next);
    setWeeklyMsg("Package confirmed.");
  }

  return (
    <div id="adminPanelWeekly" className="stack">
      <button type="button" className="btn" onClick={adminSendPaymentReminders}>
        📲 Send Payment Reminders
      </button>
      <div id="adminReminderMsg" className="muted tiny">
        {reminderMsg}
      </div>
      <div id="adminWeeklyList" className="stack">
        {!items.length ? (
          <div className="muted">No weekly packages yet.</div>
        ) : (
          items.map((it) => (
            <div key={it.weekId} className="card" style={{ padding: 12 }}>
              <div
                className="row"
                style={{ justifyContent: "space-between", alignItems: "center" }}
              >
                <div>
                  <strong>{it.nickname}</strong> — {it.walk_label}
                </div>
                <div className="tiny muted">
                  {it.week_start} · {it.pay_status}
                </div>
              </div>
              <div className="tiny muted">
                Walks: {it.walks_count} · Total: $
                {(+it.total_price).toFixed(2)} · {it.start_time}–{it.end_time}
              </div>
              <div className="row" style={{ marginTop: 8, gap: 8 }}>
                {it.pay_status === "unpaid" ? (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => adminMarkWeekPaid(it.weekId)}
                  >
                    Mark Paid
                  </button>
                ) : null}
                {it.pay_status !== "confirmed" ? (
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => adminConfirmWeek(it.weekId)}
                  >
                    Confirm & Create Walks
                  </button>
                ) : (
                  <span className="tiny muted">Confirmed</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      <div id="adminWeeklyMsg" className="muted">
        {weeklyMsg}
      </div>
    </div>
  );
}
