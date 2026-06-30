"use client";

import { useState } from "react";
import type { BookingDraft, PayMethodId } from "@/features/booking/lib/types";
import { fmt12hr, HOLD_MIN, walkTypeFromLabel } from "@/features/booking/lib/time-utils";

const PAY_METHODS: Record<
  PayMethodId,
  { name: string; enabled: boolean; instructions: string }
> = {
  venmo: {
    name: "Venmo",
    enabled: true,
    instructions: "Tap the button to open Venmo.",
  },
  cashapp: {
    name: "Cash App",
    enabled: false,
    instructions: "",
  },
  zelle: {
    name: "Zelle",
    enabled: false,
    instructions: "",
  },
};

type PaymentConfirmationProps = {
  booking: BookingDraft;
  selectedPayMethod: PayMethodId;
  paySummaryHtml: string | null;
  operatorSlug?: string;
  operatorId?: string;
  onPayMethodChange: (method: PayMethodId) => void;
  onBack: () => void;
  onSuccess: (message: string) => void;
};

function buildPaySummary(booking: BookingDraft): string {
  const dogInfo =
    (booking.dogCount || 1) > 1
      ? `<div><strong>Dogs:</strong> ${booking.dogCount} dogs (+$${booking.buddyAddon || 0} buddy add-on)</div>`
      : "";

  if (booking.isWeeklyPackage) {
    return `<div class="stack">
      <div><strong>Name:</strong> ${booking.nickname}</div>
      <div><strong>Service:</strong> ${booking.type}</div>
      <div><strong>Week of:</strong> ${booking.date || ""}</div>
      <div><strong>Days:</strong> ${booking.weekDays || ""}</div>
      <div><strong>Time:</strong> ${booking.start ? fmt12hr(booking.start) : ""} each day</div>
      <div><strong>Total:</strong> $${booking.price}</div>
    </div>`;
  }

  return `<div class="stack">
    <div><strong>Name:</strong> ${booking.nickname}</div>
    <div><strong>Service:</strong> ${booking.type}</div>
    ${dogInfo}
    <div><strong>Date:</strong> ${booking.date || ""}</div>
    <div><strong>Time:</strong> ${booking.start ? fmt12hr(booking.start) : ""}</div>
    <div><strong>Location:</strong> ${booking.serviceAddress || ""}</div>
    <div><strong>Price:</strong> $${booking.price}</div>
  </div>`;
}

export function PaymentConfirmation({
  booking,
  selectedPayMethod,
  paySummaryHtml,
  operatorSlug,
  operatorId,
  onPayMethodChange,
  onBack,
  onSuccess,
}: PaymentConfirmationProps) {
  const [paidMsg, setPaidMsg] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const method = PAY_METHODS[selectedPayMethod];
  const price = Number(booking.price);
  const note = `Dog walk - ${booking.type} - ${booking.nickname}`;
  const useStripeCheckout =
    Boolean(operatorSlug || operatorId) && !booking.isWeeklyPackage;

  async function startStripeCheckout() {
    setPaidMsg("");
    setSubmitting(true);

    try {
      if (!booking.date || !booking.start) {
        setPaidMsg("Schedule details are missing.");
        return;
      }

      const walkType = walkTypeFromLabel(booking.type, booking.isEmergency);

      const res = await fetch("/api/booking/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operatorSlug,
          operatorId,
          walkType,
          dogCount: booking.dogCount || 1,
          nickname: booking.nickname,
          email: booking.email,
          type: booking.type,
          date: booking.date,
          start: booking.start,
          end: booking.end,
          blockedEnd: booking.blockedEnd || booking.end,
          locationLabel: booking.locationLabel || "primary",
          serviceAddress: booking.serviceAddress || "",
          serviceLat: booking.serviceLat || 0,
          serviceLng: booking.serviceLng || 0,
          serviceMiles: booking.serviceMiles || 999,
          isEmergency: booking.isEmergency || false,
        }),
      });

      const data = (await res.json()) as { ok?: boolean; url?: string; error?: string };

      if (!res.ok || !data.ok || !data.url) {
        setPaidMsg(data.error || "Could not start checkout.");
        return;
      }

      window.location.href = data.url;
    } catch (e) {
      setPaidMsg(e instanceof Error ? e.message : "Could not start checkout.");
    } finally {
      setSubmitting(false);
    }
  }

  function selectPayMethod(methodId: PayMethodId) {
    const m = PAY_METHODS[methodId];
    if (!m.enabled) return;
    onPayMethodChange(methodId);
  }

  function openVenmo() {
    const webUrl = `https://venmo.com/?txn=pay&amount=${price}&note=${encodeURIComponent(note)}`;
    const w = window.open(webUrl, "_blank");
    if (!w) window.location.href = webUrl;
  }

  async function markPaid() {
    setPaidMsg("");
    setSubmitting(true);

    try {
      if (booking.isWeeklyPackage) {
        onSuccess(
          `Payment sent! Your weekly package (${booking.type}) for week of ${booking.date} is being processed.`,
        );
        return;
      }

      if (!booking.date || !booking.start) {
        setPaidMsg("Schedule details are missing.");
        return;
      }

      const payload = {
        nickname: booking.nickname,
        type: booking.type,
        price: booking.price,
        date: booking.date,
        start: booking.start,
        end: booking.end,
        blockedEnd: booking.blockedEnd || booking.end,
        locationLabel: booking.locationLabel || "primary",
        serviceAddress: booking.serviceAddress || "",
        serviceLat: booking.serviceLat || 0,
        serviceLng: booking.serviceLng || 0,
        serviceMiles: booking.serviceMiles || 999,
        holdMinutes: HOLD_MIN,
        ownerEmail: "",
        dogCount: booking.dogCount || 1,
        buddyAddon: booking.buddyAddon || 0,
        email: booking.email,
        operatorSlug,
        operatorId,
      };

      const res = await fetch("/api/booking/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        bookingId?: string;
        error?: string;
      };

      if (!res.ok || !data.ok) {
        setPaidMsg(data.error || "Could not submit request.");
        return;
      }

      const dateFmt = new Date(`${booking.date}T12:00:00`).toLocaleDateString(
        "en-US",
        { weekday: "long", month: "long", day: "numeric" },
      );

      onSuccess(
        `Walk requested! ${booking.type} on ${dateFmt} at ${fmt12hr(booking.start)} — $${booking.price}. Slot held for ${HOLD_MIN} minutes while payment is verified.`,
      );
    } catch (e) {
      setPaidMsg(e instanceof Error ? e.message : "Could not submit request.");
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  }

  function confirmPaid() {
    setConfirmOpen(true);
  }

  const summaryHtml = paySummaryHtml || buildPaySummary(booking);

  return (
    <>
      <div className="subnav">
        <button type="button" className="btn back" onClick={onBack}>
          ←
        </button>
        <span className="icon">💳</span>
        <h2>Payment</h2>
      </div>

      <div className="card stack">
        <div
          id="paySummary"
          className="muted"
          dangerouslySetInnerHTML={{ __html: summaryHtml }}
        />
        <div className="hr" />
        <div className="muted">
          {useStripeCheckout
            ? "Pay securely with card. Your operator receives the walk payment."
            : "Choose how you\u2019d like to pay, then tap \u201cI Paid\u201d when you\u2019re done."}
        </div>

        {useStripeCheckout ? (
          <button
            type="button"
            className="btn primary full"
            style={{ fontSize: 16 }}
            disabled={submitting}
            onClick={startStripeCheckout}
          >
            {submitting ? "Redirecting to Stripe…" : `Pay $${price.toFixed(2)} with Card`}
          </button>
        ) : (
          <>
            <div id="payMethodPicker" className="stack" style={{ gap: 8 }}>
              {(Object.keys(PAY_METHODS) as PayMethodId[]).map((id) => {
                const m = PAY_METHODS[id];
                return (
                  <button
                    key={id}
                    type="button"
                    className={`pay-method ${selectedPayMethod === id ? "active" : ""}`}
                    data-method={id}
                    onClick={() => selectPayMethod(id)}
                  >
                    <span className="pay-method-icon">
                      {id === "venmo" ? "💜" : id === "cashapp" ? "💚" : "🟣"}
                    </span>
                    <span className="pay-method-label">
                      <strong>{m.name}</strong>
                      {!m.enabled ? (
                        <span
                          className="pill"
                          style={{ fontSize: 10, padding: "2px 6px", marginLeft: 6 }}
                        >
                          Coming Soon
                        </span>
                      ) : null}
                    </span>
                    <span className="pay-method-check">✓</span>
                  </button>
                );
              })}
            </div>

            <div id="payAction">
              {method.enabled && selectedPayMethod === "venmo" ? (
                <>
                  <div className="muted tiny" style={{ marginBottom: 6 }}>
                    {method.instructions}
                  </div>
                  <button
                    type="button"
                    className="btn primary full"
                    id="payOpenBtn"
                    style={{ fontSize: 16 }}
                    onClick={openVenmo}
                  >
                    💜 Pay ${price} with Venmo
                  </button>
                </>
              ) : null}
              {selectedPayMethod === "zelle" && method.enabled ? (
                <div className="muted tiny">{method.instructions}</div>
              ) : null}
            </div>

            <button
              type="button"
              className="btn full"
              disabled={submitting}
              onClick={confirmPaid}
            >
              I Paid — Request Confirmation
            </button>
          </>
        )}
        {paidMsg ? <div id="paidMsg" className="muted msg-error">{paidMsg}</div> : null}
      </div>

      {!useStripeCheckout && confirmOpen ? (
        <div className="confirm-overlay legacy-admin">
          <div className="confirm-dialog">
            <h3>Did you pay with {method.name}?</h3>
            <p>
              Oops, did you send your payment? We&apos;re holding your time slot
              for you for 30 minutes. 🐶
            </p>
            <div className="confirm-btns">
              <button
                type="button"
                className="btn"
                onClick={() => setConfirmOpen(false)}
              >
                Not Yet
              </button>
              <button
                type="button"
                className="btn primary"
                disabled={submitting}
                onClick={markPaid}
              >
                Yes, I Paid
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
