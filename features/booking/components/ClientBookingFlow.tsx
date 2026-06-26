"use client";

import { useCallback, useMemo, useReducer, useState } from "react";
import Link from "next/link";
import {
  loadCustomers,
  loadPrices,
  type LegacyCustomer,
  type LegacyPrices,
} from "@/features/booking/lib/models";
import {
  buddyAddonTotal,
  regularWalkPreviewPrice,
} from "@/features/booking/lib/pricing";
import { defaultScheduleDateISO, nextMondayISO } from "@/features/booking/lib/time-utils";
import { PaymentConfirmation } from "./PaymentConfirmation";
import { SingleWalkPicker } from "./SingleWalkPicker";
import { WeeklyPackagePicker } from "./WeeklyPackagePicker";
import {
  bookingReducer,
  initialBookingState,
} from "./booking-reducer";
import "./client-booking.css";

function maxDogs(customer: LegacyCustomer | null): number {
  if (!customer) return 1;
  if (customer.dogCount && customer.dogCount >= 2) return customer.dogCount;
  const names = (customer.dogs || "").split(/[,;]/).filter(Boolean);
  return Math.max(1, names.length);
}

function resolveServiceLocation(
  customer: LegacyCustomer | null,
  locationLabel: string,
) {
  if (locationLabel === "alt" && customer?.altGeo) {
    return {
      serviceAddress: customer.altGeo.formatted || "",
      serviceLat: customer.altGeo.lat ?? 0,
      serviceLng: customer.altGeo.lng ?? 0,
      serviceMiles: customer.altGeo.miles ?? 0,
    };
  }
  if (customer?.geo) {
    return {
      serviceAddress: customer.geo.formatted || customer.address || "",
      serviceLat: customer.geo.lat ?? 0,
      serviceLng: customer.geo.lng ?? 0,
      serviceMiles: customer.geo.miles ?? 0,
    };
  }
  return {
    serviceAddress: customer?.address || "",
    serviceLat: 0,
    serviceLng: 0,
    serviceMiles: 999,
  };
}

type ClientBookingFlowProps = {
  prices?: LegacyPrices;
  operatorName?: string | null;
  operatorSlug?: string;
  operatorId?: string;
  onBack?: () => void;
};

export function ClientBookingFlow({
  prices: pricesProp,
  operatorName,
  operatorSlug,
  operatorId,
  onBack,
}: ClientBookingFlowProps = {}) {
  const [state, dispatch] = useReducer(bookingReducer, initialBookingState);
  const [emailInput, setEmailInput] = useState("");
  const [profileVisible, setProfileVisible] = useState(false);
  const [lookupMsg, setLookupMsg] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [customer, setCustomer] = useState<LegacyCustomer | null>(null);

  const prices = useMemo(() => pricesProp ?? loadPrices(), [pricesProp]);
  const customerMaxDogs = maxDogs(customer);

  const lookupCustomer = useCallback(async () => {
    const email = emailInput.trim().toLowerCase();
    setLookupMsg("");
    setProfileVisible(false);
    setCustomer(null);

    if (!email) {
      setLookupMsg("Enter your email to find your profile");
      return;
    }

    setLookupLoading(true);

    let found: LegacyCustomer | null = null;

    try {
      const res = await fetch("/api/booking/customer-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          ok?: boolean;
          customer?: {
            id?: string;
            email?: string;
            name?: string | null;
            approved?: boolean;
          };
        };

        if (data.ok && data.customer?.email) {
          found = {
            email: data.customer.email,
            name: data.customer.name || undefined,
            approved: Boolean(data.customer.approved),
          };
        }
      }
    } catch {
      // Fall back to localStorage below.
    }

    if (!found) {
      found =
        loadCustomers().find((c) => c.email?.toLowerCase() === email) || null;
    }

    setLookupLoading(false);

    if (!found) {
      setLookupMsg("No account found — register as a new customer first");
      return;
    }

    if (!found.approved) {
      setLookupMsg(
        "Your account is still waiting for approval after your Meet & Greet.",
      );
      return;
    }

    setCustomer(found);
    setProfileVisible(true);
    dispatch({
      type: "SET_CUSTOMER",
      email,
      name: found.name || email,
      locationLabel: "primary",
    });
  }, [emailInput]);

  function adjustDogCount(delta: number) {
    const next = Math.max(
      1,
      Math.min(customerMaxDogs, state.dogCount + delta),
    );
    dispatch({ type: "SET_DOG_COUNT", dogCount: next });
  }

  function startWalk(type: string, walkType: "20" | "30" | "60") {
    if (!state.customerEmail || !customer) {
      setLookupMsg("Please find your profile first.");
      return;
    }

    const price = regularWalkPreviewPrice(
      walkType,
      state.dogCount,
      prices,
    );
    const buddy = buddyAddonTotal(state.dogCount, prices);
    const loc = resolveServiceLocation(customer, state.locationLabel);

    dispatch({
      type: "START_WALK",
      booking: {
        email: state.customerEmail,
        nickname: customer.name || state.customerEmail,
        type,
        price,
        locationLabel: state.locationLabel,
        dogCount: state.dogCount,
        buddyAddon: buddy,
        ...loc,
      },
    });

    dispatch({
      type: "GO_SCHEDULE",
      scheduleDate: defaultScheduleDateISO(false),
    });
  }

  function openWeeklyPackage() {
    if (!state.customerEmail) {
      setLookupMsg("Please find your profile first.");
      return;
    }
    dispatch({
      type: "OPEN_WEEKLY",
      wpWeekStart: nextMondayISO(),
    });
  }

  function handleScheduleBack() {
    dispatch({ type: "SET_STEP", step: "select" });
  }

  if (state.successMessage) {
    return (
      <div className="client-booking legacy-admin">
        <div className="card success-banner">
          <h3>🎉 Done!</h3>
          <p className="muted">{state.successMessage}</p>
          <button
            type="button"
            className="btn primary full"
            style={{ marginTop: 16 }}
            onClick={() => {
              dispatch({ type: "RESET" });
              setProfileVisible(false);
              setCustomer(null);
              setEmailInput("");
              setLookupMsg("");
            }}
          >
            Book Another Walk
          </button>
          <Link href="/" className="btn full" style={{ marginTop: 8, display: "block", textAlign: "center", textDecoration: "none" }}>
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (state.step === "schedule" && state.booking) {
    return (
      <div className="client-booking legacy-admin">
        <SingleWalkPicker
          booking={state.booking}
          date={state.scheduleDate}
          time={state.scheduleTime}
          onDateChange={(date) =>
            dispatch({ type: "SET_SCHEDULE_DATE", date })
          }
          onTimeChange={(time) =>
            dispatch({ type: "SET_SCHEDULE_TIME", time })
          }
          onConfirm={(validated) => {
            dispatch({ type: "CONFIRM_SCHEDULE", ...validated });
          }}
          onBack={handleScheduleBack}
        />
      </div>
    );
  }

  if (state.step === "weekly") {
    return (
      <div className="client-booking legacy-admin">
        <WeeklyPackagePicker
          email={state.customerEmail}
          customer={customer}
          locationLabel={state.locationLabel}
          wp={state.wp}
          wpDogCount={state.wpDogCount}
          selectedDays={state.wpSelectedDays}
          startTime={state.wpStartTime}
          weekStart={state.wpWeekStart}
          prices={prices}
          onLocationChange={(label) =>
            dispatch({ type: "SET_LOCATION", locationLabel: label })
          }
          onWpChange={(wp) => dispatch({ type: "SET_WP", wp })}
          onDogCountChange={(count) =>
            dispatch({ type: "SET_WP_DOG_COUNT", dogCount: count })
          }
          onDaysChange={(days) =>
            dispatch({ type: "SET_WP_DAYS", days })
          }
          onStartTimeChange={(start) =>
            dispatch({ type: "SET_WP_START", start })
          }
          onSubmit={({ booking, paySummaryHtml }) =>
            dispatch({ type: "SUBMIT_WEEKLY", booking, paySummaryHtml })
          }
          onBack={() => dispatch({ type: "SET_STEP", step: "select" })}
        />
      </div>
    );
  }

  if (state.step === "pay" && state.booking) {
    return (
      <div className="client-booking legacy-admin">
        <PaymentConfirmation
          booking={state.booking}
          selectedPayMethod={state.selectedPayMethod}
          paySummaryHtml={state.paySummaryHtml}
          operatorSlug={operatorSlug}
          operatorId={operatorId}
          onPayMethodChange={(method) =>
            dispatch({ type: "SET_PAY_METHOD", method })
          }
          onBack={() =>
            dispatch({
              type: "SET_STEP",
              step: state.booking?.isWeeklyPackage ? "weekly" : "schedule",
            })
          }
          onSuccess={(message) =>
            dispatch({ type: "SET_SUCCESS", message })
          }
        />
      </div>
    );
  }

  const extra = buddyAddonTotal(state.dogCount, prices);
  const firstName = customer?.name?.split(" ")[0] || "there";

  return (
    <div className="client-booking legacy-admin">
      <div className="subnav">
        {onBack ? (
          <button type="button" className="btn back" onClick={onBack}>
            ←
          </button>
        ) : (
          <Link href="/" className="btn back" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            ←
          </Link>
        )}
        <span className="icon">🐕</span>
        <h2>Book a Walk</h2>
        {operatorName ? (
          <p className="muted tiny" style={{ margin: 0 }}>
            with {operatorName}
          </p>
        ) : null}
      </div>

      {!profileVisible ? (
        <div className="card stack">
          <div className="stack">
            <label className="field-label">EMAIL ADDRESS</label>
            <input
              id="returnEmail"
              type="email"
              placeholder="you@email.com"
              autoComplete="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn primary full"
            onClick={() => void lookupCustomer()}
            disabled={lookupLoading}
          >
            {lookupLoading ? "Looking up…" : "Find My Profile"}
          </button>
          {lookupMsg ? (
            <div className="muted tiny msg-warn">{lookupMsg}</div>
          ) : null}
        </div>
      ) : (
        <>
          <div className="card stack">
            <div
              id="returnWelcome"
              style={{ fontSize: 16, fontWeight: 700, color: "var(--blue, #1e6fd4)" }}
            >
              Welcome back, {firstName}! 🐾
            </div>
            <label className="field-label">SERVICE LOCATION</label>
            <select
              id="returnLocation"
              value={state.locationLabel}
              onChange={(e) =>
                dispatch({
                  type: "SET_LOCATION",
                  locationLabel: e.target.value,
                })
              }
            >
              <option value="primary">
                {customer?.geo?.formatted || customer?.address || "Primary address"}
              </option>
              {customer?.altGeo?.formatted ? (
                <option value="alt">{customer.altGeo.formatted}</option>
              ) : null}
            </select>
          </div>

          <div className="card stack">
            <div className="field-label">CHOOSE A WALK</div>
            <div style={{ textAlign: "center", marginBottom: 4 }}>
              <span
                className="trust-pill"
                style={{ fontWeight: 600, color: "var(--green-dk)" }}
              >
                Fully Insured &amp; Bonded
              </span>
            </div>

            {customerMaxDogs >= 2 ? (
              <div
                id="buddyWalkPicker"
                style={{
                  background: "rgba(30,168,112,0.08)",
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      🐕 How many dogs?
                    </div>
                    <div className="muted tiny" id="buddyPriceHint">
                      {state.dogCount === 1
                        ? `+$${prices.buddyAddon || 10} per additional dog`
                        : `${state.dogCount} dogs · +$${extra} added to each walk`}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <button
                      type="button"
                      className="btn"
                      style={{
                        width: 36,
                        height: 36,
                        padding: 0,
                        fontSize: 18,
                        fontWeight: 700,
                      }}
                      onClick={() => adjustDogCount(-1)}
                    >
                      −
                    </button>
                    <span
                      id="walkDogCount"
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        minWidth: 24,
                        textAlign: "center",
                      }}
                    >
                      {state.dogCount}
                    </span>
                    <button
                      type="button"
                      className="btn"
                      style={{
                        width: 36,
                        height: 36,
                        padding: 0,
                        fontSize: 18,
                        fontWeight: 700,
                      }}
                      onClick={() => adjustDogCount(1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="stack" style={{ gap: 8 }}>
              <button
                type="button"
                id="btnR20"
                className="btn primary full"
                onClick={() => startWalk("Regular 20 min", "20")}
              >
                20 min — ${regularWalkPreviewPrice("20", state.dogCount, prices)}
              </button>
              <button
                type="button"
                id="btnR30"
                className="btn primary full"
                onClick={() => startWalk("Regular 30 min", "30")}
              >
                30 min — ${regularWalkPreviewPrice("30", state.dogCount, prices)}
              </button>
              <button
                type="button"
                id="btnR60"
                className="btn primary full"
                onClick={() => startWalk("Regular 60 min", "60")}
              >
                60 min — ${regularWalkPreviewPrice("60", state.dogCount, prices)}
              </button>
            </div>
          </div>

          <div className="card stack">
            <div className="field-label">WEEKLY PACKAGE</div>
            <div className="muted">
              Fixed days + fixed time. Paid weekly in advance by{" "}
              <strong>Sunday at midnight</strong>.
            </div>
            <button
              type="button"
              id="btnWeeklyPackage"
              className="btn-weekly-promo"
              onClick={openWeeklyPackage}
            >
              📅 Set up Weekly Package{" "}
              <span className="save-badge">
                SAVE {prices.weeklyDiscount}%
              </span>
            </button>
            <div className="muted tiny">
              Reservations must be made by midnight prior to service (except
              Emergency Walk).
            </div>
          </div>
        </>
      )}
    </div>
  );
}
