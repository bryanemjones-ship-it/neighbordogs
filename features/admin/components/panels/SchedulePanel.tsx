"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  loadWalkers,
  type LegacyBooking,
  type LegacyWalker,
} from "@/features/booking/lib/models";
import { fmt12hr, todayISO, tomorrowISO } from "@/features/booking/lib/pricing-helpers";
import { supabase } from "@/shared/lib/supabase";

type SchedulePanelProps = {
  showToast: (title: string, message: string) => void;
};

async function adminAuthHeaders(): Promise<HeadersInit> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Unauthorized");
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
  };
}

export function SchedulePanel({ showToast }: SchedulePanelProps) {
  const router = useRouter();
  const [scheduleDate, setScheduleDate] = useState(todayISO());
  const [bookings, setBookings] = useState<LegacyBooking[]>([]);
  const [walkers, setWalkers] = useState<LegacyWalker[]>([]);
  const [scheduleMsg, setScheduleMsg] = useState("");
  const [digestMsg, setDigestMsg] = useState("");

  const loadSchedule = useCallback(async () => {
    setScheduleMsg("Loading…");
    try {
      const headers = await adminAuthHeaders();
      const res = await fetch(
        `/api/admin/bookings?date=${encodeURIComponent(scheduleDate)}`,
        { headers },
      );
      const data = (await res.json()) as {
        ok?: boolean;
        bookings?: LegacyBooking[];
        error?: string;
      };

      if (res.status === 401) {
        router.replace("/login");
        return;
      }

      if (!res.ok || !data.ok) {
        setScheduleMsg(data.error || "Could not load schedule.");
        setBookings([]);
        return;
      }

      setBookings(data.bookings || []);
      setWalkers(loadWalkers());
      setScheduleMsg("");
    } catch (error) {
      if (error instanceof Error && error.message === "Unauthorized") {
        router.replace("/login");
        return;
      }
      setScheduleMsg("Could not load schedule.");
      setBookings([]);
    }
  }, [scheduleDate, router]);

  useEffect(() => {
    void loadSchedule();
  }, [loadSchedule]);

  async function assignWalker(bookingId: string | number, walkerId: string) {
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: {
          ...(await adminAuthHeaders()),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: String(bookingId),
          walker_id: walkerId || null,
        }),
      });

      if (res.status === 401) {
        router.replace("/login");
        return;
      }

      if (!res.ok) {
        showToast("Error", "Could not assign walker.");
        return;
      }

      await loadSchedule();
    } catch (error) {
      if (error instanceof Error && error.message === "Unauthorized") {
        router.replace("/login");
        return;
      }
      showToast("Error", "Could not assign walker.");
    }
  }

  async function adminCancelWalk(bookingId: string | number) {
    const reason = window.prompt(
      "The customer will receive an apology email. What's the reason?",
      "scheduling conflict",
    );
    if (reason === null) return;

    try {
      const res = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: {
          ...(await adminAuthHeaders()),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: String(bookingId),
          status: "cancelled_by_provider",
        }),
      });

      if (res.status === 401) {
        router.replace("/login");
        return;
      }

      if (!res.ok) {
        showToast("Error", "Could not cancel walk.");
        return;
      }

      showToast("Walk Cancelled", "Customer cancellation recorded.");
      await loadSchedule();
    } catch (error) {
      if (error instanceof Error && error.message === "Unauthorized") {
        router.replace("/login");
        return;
      }
      showToast("Error", "Could not cancel walk.");
    }
  }

  function adminSendScheduleDigest() {
    setDigestMsg("Sending…");
    const count = bookings.length;
    const revenue = bookings.reduce(
      (sum, b) => sum + (parseFloat(String(b.price || 0)) || 0),
      0,
    );
    setDigestMsg(
      `Sent! ${count} walk${count !== 1 ? "s" : ""} — $${revenue.toFixed(2)} total.`,
    );
    showToast(
      "Schedule Sent 📧",
      `Today's schedule summary — ${count} walk${count !== 1 ? "s" : ""}.`,
    );
  }

  const dateFmt = new Date(`${scheduleDate}T12:00:00`).toLocaleDateString(
    "en-US",
    { weekday: "long", month: "long", day: "numeric" },
  );

  return (
    <div id="adminPanelSchedule" className="stack">
      <div className="row" style={{ gap: 10, alignItems: "flex-end" }}>
        <div className="stack" style={{ flex: 1 }}>
          <label className="field-label" htmlFor="scheduleDate">
            DATE
          </label>
          <input
            id="scheduleDate"
            type="date"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="btn"
          onClick={() => {
            setScheduleDate(todayISO());
          }}
        >
          Today
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            setScheduleDate(tomorrowISO());
          }}
        >
          Tomorrow
        </button>
      </div>

      <button type="button" className="btn" onClick={adminSendScheduleDigest}>
        📧 Email Today&apos;s Schedule
      </button>
      <div id="adminDigestMsg" className="muted tiny">
        {digestMsg}
      </div>

      <div id="scheduleList" className="stack">
        {!bookings.length ? (
          <div style={{ textAlign: "center", padding: "32px 16px" }}>
            <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}>
              🐕
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              No walks scheduled
            </div>
            <div className="muted">{dateFmt}</div>
          </div>
        ) : (
          <>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                {dateFmt}
              </div>
              <div className="muted tiny">
                {bookings.length} appointment{bookings.length > 1 ? "s" : ""}
              </div>
            </div>
            {bookings.map((b) => {
              const isMG = (b.type || "").toLowerCase().includes("meet");
              const isWalk = !isMG && b.status === "confirmed";
              const statusClass =
                {
                  confirmed: "pill ok",
                  completed: "pill ok",
                  attempted: "pill warn",
                  cancelled: "pill warn",
                  pending: "pill",
                  hold: "pill",
                }[b.status || ""] || "pill";
              const canCancel =
                b.status !== "cancelled_by_customer" &&
                b.status !== "cancelled_by_provider" &&
                b.status !== "cancelled";

              return (
                <div key={String(b.id)} className="card">
                  <div
                    className="row"
                    style={{
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 10,
                    }}
                  >
                    <div className="stack" style={{ gap: 4, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 20 }}>{isMG ? "🤝" : "🐕"}</span>
                        <strong style={{ fontSize: 16 }}>
                          {fmt12hr(b.start || "00:00")} –{" "}
                          {fmt12hr(b.end || b.blockedEnd || "00:00")}
                        </strong>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>
                        {b.nickname || ""}
                      </div>
                      <div className="tiny muted">
                        {b.type || ""} · ${b.price || "0"}
                      </div>
                      {b.serviceAddress ? (
                        <div className="tiny muted">📍 {b.serviceAddress}</div>
                      ) : null}
                      {isWalk && walkers.length ? (
                        <div style={{ marginTop: 4 }}>
                          <select
                            style={{
                              fontSize: 12,
                              padding: "4px 8px",
                              borderRadius: 8,
                            }}
                            value={b.walker_id ? String(b.walker_id) : ""}
                            onChange={(e) =>
                              void assignWalker(b.id ?? "", e.target.value)
                            }
                          >
                            <option value="">Assign walker…</option>
                            {walkers.map((w) => (
                              <option key={w.id} value={w.id}>
                                {w.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : null}
                    </div>
                    <div
                      className="stack"
                      style={{ gap: 6, alignItems: "flex-end" }}
                    >
                      <span className={statusClass}>{b.status || ""}</span>
                      {canCancel && b.id ? (
                        <button
                          type="button"
                          className="btn"
                          style={{
                            padding: "6px 10px",
                            fontSize: 12,
                            color: "var(--red)",
                          }}
                          onClick={() => void adminCancelWalk(b.id!)}
                        >
                          Cancel
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      <div id="scheduleMsg" className="muted">
        {scheduleMsg}
      </div>
    </div>
  );
}
