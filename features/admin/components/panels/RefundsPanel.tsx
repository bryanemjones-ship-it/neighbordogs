"use client";

import { useCallback, useEffect, useState } from "react";
import {
  loadBookings,
  loadCustomers,
  loadRefunds,
  nextLocalId,
  saveBookings,
  saveRefunds,
  type LegacyBooking,
  type LegacyRefund,
} from "@/features/booking/lib/models";

const ATTEMPTED_MSG =
  "Walk Attempted – No Service Completed\n\nWe arrived as scheduled but were unable to complete the walk because we could not gain access to the home or the dog was not present.\n\nThis visit has been marked as Attempted. Attempted visits are not refundable. Please contact us if you believe this was marked in error.";

type RefundsPanelProps = {
  showToast?: (title: string, message: string) => void;
};

export function RefundsPanel(_props: RefundsPanelProps) {
  const [customerNick, setCustomerNick] = useState("");
  const [customerOptions, setCustomerOptions] = useState<
    { nickname: string; pendingRefunds: number }[]
  >([]);
  const [summaryHtml, setSummaryHtml] = useState("");
  const [bookings, setBookings] = useState<LegacyBooking[]>([]);
  const [refunds, setRefunds] = useState<LegacyRefund[]>([]);
  const [refundMsg, setRefundMsg] = useState("");
  const [refundRefs, setRefundRefs] = useState<Record<number, string>>({});

  const [providerOpen, setProviderOpen] = useState(false);
  const [providerBookingId, setProviderBookingId] = useState("");
  const [pcReason, setPcReason] = useState("Illness");
  const [pcNotes, setPcNotes] = useState("");
  const [pcRefundMode, setPcRefundMode] = useState("full");
  const [pcPartialAmount, setPcPartialAmount] = useState("");
  const [pcRefundMethod, setPcRefundMethod] = useState("venmo");
  const [pcMsg, setPcMsg] = useState("");

  const [attemptedOpen, setAttemptedOpen] = useState(false);
  const [attemptedBookingId, setAttemptedBookingId] = useState("");
  const [attReason, setAttReason] = useState("No access to home");
  const [attNotes, setAttNotes] = useState("");
  const [attMsg, setAttMsg] = useState("");

  const [visitOpen, setVisitOpen] = useState(false);
  const [visitBookingId, setVisitBookingId] = useState("");
  const [visitMarkCompleted, setVisitMarkCompleted] = useState(false);
  const [vrPee, setVrPee] = useState(false);
  const [vrPoop, setVrPoop] = useState(false);
  const [vrNote, setVrNote] = useState("");
  const [vrMsg, setVrMsg] = useState("");

  const adminLoadCustomerList = useCallback(() => {
    const customers = loadCustomers();
    setCustomerOptions(
      customers.map((c) => {
        const nickname = c.name || c.nickname || c.email;
        const pendingRefunds = loadRefunds().filter(
          (r) => r.nickname === nickname && r.status === "approved",
        ).length;
        return { nickname: nickname || "", pendingRefunds };
      }),
    );
  }, []);

  useEffect(() => {
    adminLoadCustomerList();
  }, [adminLoadCustomerList]);

  function adminLoadCustomerHistory() {
    const nick = customerNick;
    if (!nick) {
      setRefundMsg("Pick a customer.");
      return;
    }
    setRefundMsg("Loading…");
    const customers = loadCustomers();
    const c = customers.find(
      (x) => (x.name || x.nickname || x.email) === nick,
    );
    const allBookings = loadBookings().filter((b) => b.nickname === nick);
    const allRefunds = loadRefunds().filter((r) => r.nickname === nick);
    const totalRefunded = allRefunds
      .filter((r) => r.status === "processed")
      .reduce((s, r) => s + (parseFloat(String(r.amount)) || 0), 0);
    const pendingRefunds = allRefunds.filter((r) => r.status === "approved").length;

    setSummaryHtml(
      `<strong>${nick}</strong> · ${c?.name || ""}<br><span class="tiny">${c?.phone || ""}${c?.email ? " · " + c.email : ""}</span><br><span class="tiny">Total refunded: $${totalRefunded.toFixed(2)} · Pending: ${pendingRefunds}</span>`,
    );
    setBookings(allBookings);
    setRefunds(allRefunds);
    setRefundMsg("");
  }

  function openProviderCancelModal(id: number | string) {
    setProviderBookingId(String(id));
    setPcMsg("");
    setProviderOpen(true);
  }

  function submitProviderCancel() {
    if (pcRefundMode === "partial" && (!pcPartialAmount || Number(pcPartialAmount) <= 0)) {
      setPcMsg("Enter a valid partial amount.");
      return;
    }
    const nextBookings = loadBookings().map((b) =>
      String(b.id) === providerBookingId
        ? {
            ...b,
            status: "cancelled_by_provider",
            cancelReason: pcReason,
            cancelType: "provider",
            refundStatus: pcRefundMode === "none" ? "none" : "approved",
          }
        : b,
    );
    saveBookings(nextBookings);
    if (pcRefundMode !== "none") {
      const booking = nextBookings.find((b) => String(b.id) === providerBookingId);
      const refundsList = loadRefunds();
      refundsList.push({
        id: nextLocalId(refundsList),
        amount:
          pcRefundMode === "partial"
            ? pcPartialAmount
            : booking?.price || 0,
        method: pcRefundMethod,
        status: "approved",
        createdAt: new Date().toISOString(),
        nickname: booking?.nickname,
        bookingDate: booking?.date,
        bookingStart: booking?.start,
      });
      saveRefunds(refundsList);
    }
    setPcMsg("✅ Saved. Refund is approved.");
    window.setTimeout(() => {
      setProviderOpen(false);
      adminLoadCustomerHistory();
    }, 600);
  }

  function openAttemptedModal(id: number | string) {
    setAttemptedBookingId(String(id));
    setAttReason("No access to home");
    setAttNotes("");
    setAttMsg("");
    setAttemptedOpen(true);
  }

  function submitMarkAttempted() {
    const nextBookings = loadBookings().map((b) =>
      String(b.id) === attemptedBookingId
        ? { ...b, status: "attempted", attemptedReason: attReason }
        : b,
    );
    saveBookings(nextBookings);
    setAttMsg("✅ Saved.");
    window.setTimeout(() => {
      setAttemptedOpen(false);
      adminLoadCustomerHistory();
    }, 600);
  }

  function openVisitReportModal(id: number | string, markCompleted: boolean) {
    const b = bookings.find((x) => String(x.id) === String(id));
    setVisitBookingId(String(id));
    setVisitMarkCompleted(markCompleted);
    setVrNote(b?.visitNote || "");
    setVrPee(String(b?.pottyPee) === "1" || b?.pottyPee === true);
    setVrPoop(String(b?.pottyPoop) === "1" || b?.pottyPoop === true);
    setVrMsg("");
    setVisitOpen(true);
  }

  function submitVisitReport() {
    const nextBookings = loadBookings().map((b) =>
      String(b.id) === visitBookingId
        ? {
            ...b,
            visitNote: vrNote,
            pottyPee: vrPee ? 1 : 0,
            pottyPoop: vrPoop ? 1 : 0,
            visitReportedAt: new Date().toISOString(),
            status: visitMarkCompleted ? "completed" : b.status,
          }
        : b,
    );
    saveBookings(nextBookings);
    setVrMsg("✅ Saved.");
    window.setTimeout(() => {
      setVisitOpen(false);
      adminLoadCustomerHistory();
    }, 600);
  }

  function adminMarkRefundProcessed(refundId: number) {
    setRefundMsg("Saving…");
    const reference = refundRefs[refundId] || "";
    const next = loadRefunds().map((r) =>
      r.id === refundId
        ? {
            ...r,
            status: "processed",
            processedAt: new Date().toISOString(),
            reference,
          }
        : r,
    );
    saveRefunds(next);
    setRefundMsg("✅ Refund processed.");
    adminLoadCustomerHistory();
  }

  return (
    <>
      <div id="adminPanelRefunds" className="stack">
        <div className="muted tiny">
          Look up a customer to see cancellation + refund history.
        </div>
        <div
          className="row"
          style={{ gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}
        >
          <div className="stack" style={{ minWidth: 240, flex: 1 }}>
            <label htmlFor="adminCustomerSelect">Customer</label>
            <select
              id="adminCustomerSelect"
              value={customerNick}
              onChange={(e) => setCustomerNick(e.target.value)}
            >
              <option value="">— Select customer —</option>
              {customerOptions.map((c) => (
                <option key={c.nickname} value={c.nickname}>
                  {c.nickname}
                  {c.pendingRefunds > 0 ? ` · ${c.pendingRefunds} pending` : ""}
                </option>
              ))}
            </select>
          </div>
          <button type="button" className="btn" onClick={adminLoadCustomerList}>
            Refresh list
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={adminLoadCustomerHistory}
          >
            Load history
          </button>
        </div>
        <div
          id="adminCustomerSummary"
          className="muted"
          dangerouslySetInnerHTML={{ __html: summaryHtml }}
        />
        <div className="hr" />
        <div className="stack">
          <div
            className="row"
            style={{ justifyContent: "space-between", alignItems: "center" }}
          >
            <strong>Upcoming / Recent Bookings</strong>
            <span className="tiny muted">Provider cancel is logged here</span>
          </div>
          <div id="adminCustomerBookings" className="stack">
            {!bookings.length ? (
              <div className="muted">No bookings found.</div>
            ) : (
              bookings.map((b) => {
                const sp =
                  {
                    cancelled: "pill warn",
                    confirmed: "pill ok",
                    attempted: "pill warn",
                    completed: "pill ok",
                  }[b.status || ""] || "pill";
                return (
                  <div key={String(b.id)} className="card">
                    <div
                      className="row"
                      style={{
                        justifyContent: "space-between",
                        gap: 10,
                        alignItems: "flex-start",
                      }}
                    >
                      <div className="stack" style={{ gap: 6, flex: 1 }}>
                        <div>
                          <strong>
                            {b.date} {b.start}
                          </strong>{" "}
                          · {b.type} · ${b.price}
                        </div>
                        <div className="tiny">
                          {b.serviceAddress || ""}{" "}
                          <span className={sp}>{b.status}</span>
                        </div>
                        {b.attemptedReason ? (
                          <div className="tiny muted">
                            Attempted: {b.attemptedReason}
                          </div>
                        ) : null}
                        {b.cancelReason ? (
                          <div className="tiny muted">
                            Cancel: {b.cancelReason} ({b.cancelType})
                          </div>
                        ) : null}
                      </div>
                      <div className="stack" style={{ gap: 8 }}>
                        {b.status === "confirmed" ? (
                          <>
                            <button
                              type="button"
                              className="btn"
                              onClick={() => openProviderCancelModal(b.id!)}
                            >
                              Provider Cancel
                            </button>
                            <button
                              type="button"
                              className="btn"
                              onClick={() => openAttemptedModal(b.id!)}
                            >
                              Mark Attempted
                            </button>
                            <button
                              type="button"
                              className="btn primary"
                              onClick={() => openVisitReportModal(b.id!, true)}
                            >
                              Complete + Report
                            </button>
                          </>
                        ) : null}
                        {b.status === "completed" ? (
                          <button
                            type="button"
                            className="btn primary"
                            onClick={() => openVisitReportModal(b.id!, false)}
                          >
                            Edit Report
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        <div className="hr" />
        <div className="stack">
          <div
            className="row"
            style={{ justifyContent: "space-between", alignItems: "center" }}
          >
            <strong>Refunds</strong>
            <span className="tiny muted">
              Approved → Processed when you send it
            </span>
          </div>
          <div id="adminCustomerRefunds" className="stack">
            {!refunds.length ? (
              <div className="muted">No refunds yet.</div>
            ) : (
              refunds.map((r) => {
                const pill =
                  r.status === "processed"
                    ? "pill ok"
                    : r.status === "approved"
                      ? "pill warn"
                      : "pill";
                return (
                  <div key={r.id} className="card">
                    <div>
                      <strong>${r.amount}</strong> · {r.method || "venmo"}{" "}
                      <span className={pill}>{r.status}</span>
                    </div>
                    <div className="tiny">Created: {r.createdAt || ""}</div>
                    {r.status === "approved" ? (
                      <div
                        className="row"
                        style={{ gap: 10, marginTop: 8, alignItems: "center" }}
                      >
                        <input
                          placeholder="Venmo reference"
                          style={{ flex: 1, minWidth: 200 }}
                          value={refundRefs[r.id] || ""}
                          onChange={(e) =>
                            setRefundRefs((prev) => ({
                              ...prev,
                              [r.id]: e.target.value,
                            }))
                          }
                        />
                        <button
                          type="button"
                          className="btn primary"
                          onClick={() => adminMarkRefundProcessed(r.id)}
                        >
                          Mark Processed
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </div>
        <div id="adminRefundMsg" className="muted">
          {refundMsg}
        </div>
      </div>

      <div
        id="providerCancelModal"
        className={providerOpen ? "modal-overlay" : "modal-overlay hidden"}
      >
        <div className="card stack">
          <div
            className="row"
            style={{ alignItems: "center", justifyContent: "space-between" }}
          >
            <strong>Provider Cancellation</strong>
            <button
              type="button"
              className="btn"
              onClick={() => setProviderOpen(false)}
            >
              Close
            </button>
          </div>
          <div className="muted tiny">
            Use this when <b>you cannot perform the walk</b>. Refund defaults to{" "}
            <b>full approval</b>.
          </div>
          <div className="stack">
            <label htmlFor="pc_reason">Reason</label>
            <select
              id="pc_reason"
              value={pcReason}
              onChange={(e) => setPcReason(e.target.value)}
            >
              <option>Illness</option>
              <option>Emergency</option>
              <option>Weather</option>
              <option>Safety concern</option>
              <option>Logistics / Overbooking</option>
              <option>Other</option>
            </select>
          </div>
          <div className="stack">
            <label htmlFor="pc_notes">Notes (optional)</label>
            <input
              id="pc_notes"
              placeholder="Extra details"
              value={pcNotes}
              onChange={(e) => setPcNotes(e.target.value)}
            />
          </div>
          <div className="stack">
            <label>Refund outcome</label>
            <div className="row" style={{ gap: 10 }}>
              {(["full", "partial", "none"] as const).map((mode) => (
                <label key={mode} className="tiny">
                  <input
                    type="radio"
                    name="pc_refund_mode"
                    value={mode}
                    checked={pcRefundMode === mode}
                    onChange={() => setPcRefundMode(mode)}
                  />{" "}
                  {mode === "full"
                    ? "Full refund"
                    : mode === "partial"
                      ? "Partial"
                      : "None"}
                </label>
              ))}
            </div>
            <div className="row" style={{ gap: 10, alignItems: "center" }}>
              <span className="tiny muted" style={{ minWidth: 120 }}>
                Partial amount ($)
              </span>
              <input
                id="pc_partial_amount"
                type="number"
                min={0}
                step={0.01}
                disabled={pcRefundMode !== "partial"}
                style={{ maxWidth: 160 }}
                value={pcPartialAmount}
                onChange={(e) => setPcPartialAmount(e.target.value)}
              />
            </div>
          </div>
          <div className="stack">
            <label htmlFor="pc_refund_method">Refund method</label>
            <select
              id="pc_refund_method"
              value={pcRefundMethod}
              onChange={(e) => setPcRefundMethod(e.target.value)}
            >
              <option value="venmo">Venmo</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
            </select>
          </div>
          <button
            type="button"
            className="btn primary full"
            onClick={submitProviderCancel}
          >
            Confirm Provider Cancellation
          </button>
          <div id="pc_msg" className="muted">
            {pcMsg}
          </div>
        </div>
      </div>

      <div
        id="attemptedModal"
        className={attemptedOpen ? "modal-overlay" : "modal-overlay hidden"}
      >
        <div className="card stack">
          <div
            className="row"
            style={{ alignItems: "center", justifyContent: "space-between" }}
          >
            <strong>Mark Walk as Attempted</strong>
            <button
              type="button"
              className="btn"
              onClick={() => setAttemptedOpen(false)}
            >
              Close
            </button>
          </div>
          <div className="muted tiny">
            You arrived as scheduled but could not complete the walk. Marks as{" "}
            <b>Attempted</b> (not refundable).
          </div>
          <div className="stack">
            <label htmlFor="att_reason">Reason</label>
            <select
              id="att_reason"
              value={attReason}
              onChange={(e) => setAttReason(e.target.value)}
            >
              <option>No access to home</option>
              <option>Dog not present</option>
              <option>Incorrect instructions</option>
              <option>Other</option>
            </select>
          </div>
          <div className="stack">
            <label htmlFor="att_notes">Notes (optional)</label>
            <input
              id="att_notes"
              placeholder="Short factual note"
              value={attNotes}
              onChange={(e) => setAttNotes(e.target.value)}
            />
          </div>
          <div className="muted tiny">
            Customer message:
            <div className="card" style={{ marginTop: 6 }}>
              <div className="tiny" id="att_customer_msg">
                {ATTEMPTED_MSG}
              </div>
            </div>
          </div>
          <div className="row" style={{ gap: 10, alignItems: "center" }}>
            <button
              type="button"
              className="btn primary"
              onClick={submitMarkAttempted}
            >
              Mark Attempted
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                void navigator.clipboard.writeText(ATTEMPTED_MSG);
                setAttMsg("✅ Copied.");
              }}
            >
              Copy message
            </button>
            <span id="att_msg" className="muted tiny">
              {attMsg}
            </span>
          </div>
        </div>
      </div>

      <div
        id="visitReportModal"
        className={visitOpen ? "modal-overlay" : "modal-overlay hidden"}
      >
        <div className="card stack" style={{ maxWidth: 560 }}>
          <div
            className="row"
            style={{ alignItems: "center", justifyContent: "space-between" }}
          >
            <strong>Visit Report</strong>
            <button type="button" className="btn" onClick={() => setVisitOpen(false)}>
              Close
            </button>
          </div>
          <div className="stack">
            <label>Pee / Poop (optional)</label>
            <div className="row" style={{ gap: 12 }}>
              <label className="tiny">
                <input
                  type="checkbox"
                  id="vr_pee"
                  checked={vrPee}
                  onChange={(e) => setVrPee(e.target.checked)}
                />{" "}
                Pee
              </label>
              <label className="tiny">
                <input
                  type="checkbox"
                  id="vr_poop"
                  checked={vrPoop}
                  onChange={(e) => setVrPoop(e.target.checked)}
                />{" "}
                Poop
              </label>
            </div>
          </div>
          <div className="stack">
            <label htmlFor="vr_note">Short note (optional)</label>
            <textarea
              id="vr_note"
              placeholder="Example: Great walk today."
              value={vrNote}
              onChange={(e) => setVrNote(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn primary"
            onClick={submitVisitReport}
          >
            Save Visit Report
          </button>
          <span id="vr_msg" className="muted tiny">
            {vrMsg}
          </span>
        </div>
      </div>
    </>
  );
}
