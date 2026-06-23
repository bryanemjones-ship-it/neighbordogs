"use client";

import { useCallback, useEffect, useState } from "react";
import {
  buddyAddonTotal,
  recalcWeeklyPackageTotal,
  weeklyPackageEndTimes,
  weeklyWalkPreviewPrice,
} from "@/features/booking/lib/pricing";
import type { LegacyCustomer, LegacyPrices } from "@/features/booking/lib/models";
import type { SlotOption, WalkDay, WeeklyPackageDraft } from "@/features/booking/lib/types";
import { WALK_DAYS } from "@/features/booking/lib/types";
import { fmt12hr, nextMondayISO } from "@/features/booking/lib/time-utils";

type WeeklyPackagePickerProps = {
  email: string;
  customer: LegacyCustomer | null;
  locationLabel: string;
  wp: WeeklyPackageDraft;
  wpDogCount: number;
  selectedDays: WalkDay[];
  startTime: string;
  weekStart: string;
  prices: LegacyPrices;
  onLocationChange: (label: string) => void;
  onWpChange: (wp: WeeklyPackageDraft) => void;
  onDogCountChange: (count: number) => void;
  onDaysChange: (days: WalkDay[]) => void;
  onStartTimeChange: (start: string) => void;
  onSubmit: (result: {
    booking: {
      nickname: string;
      type: string;
      price: string;
      date: string;
      start: string;
      end: string;
      blockedEnd: string;
      locationLabel: string;
      serviceAddress: string;
      serviceLat: number;
      serviceLng: number;
      serviceMiles: number;
      isWeeklyPackage: true;
      weeklyPackageId: number | string;
      weekDays: string;
      dogCount: number;
      buddyAddon: number;
      email: string;
    };
    paySummaryHtml: string;
  }) => void;
  onBack: () => void;
};

function maxDogs(customer: LegacyCustomer | null): number {
  if (!customer) return 1;
  if (customer.dogCount && customer.dogCount >= 2) return customer.dogCount;
  const names = (customer.dogs || "").split(/[,;]/).filter(Boolean);
  return Math.max(1, names.length);
}

export function WeeklyPackagePicker({
  email,
  customer,
  locationLabel,
  wp,
  wpDogCount,
  selectedDays,
  startTime,
  weekStart,
  prices,
  onLocationChange,
  onWpChange,
  onDogCountChange,
  onDaysChange,
  onStartTimeChange,
  onSubmit,
  onBack,
}: WeeklyPackagePickerProps) {
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const customerMaxDogs = maxDogs(customer);
  const dayCount = selectedDays.length;
  const total = recalcWeeklyPackageTotal(wp.perWalkPrice, dayCount);
  const wpExtra = buddyAddonTotal(wpDogCount, prices);

  const loadWpSlots = useCallback(async (dur: number) => {
    const future = new Date();
    future.setDate(future.getDate() + 14);
    const dateISO = future.toISOString().slice(0, 10);
    const walkType = dur >= 60 ? "60" : dur >= 30 ? "30" : "20";

    try {
      const res = await fetch(
        `/api/booking/slots?date=${encodeURIComponent(dateISO)}&walkType=${walkType}`,
      );
      const data = (await res.json()) as { slots?: SlotOption[] };
      setSlots(data.slots || []);
    } catch {
      setSlots([]);
    }
  }, []);

  useEffect(() => {
    loadWpSlots(30);
  }, [loadWpSlots]);

  function wpSelectWalk(label: string, walkType: "20" | "30" | "60") {
    const price = weeklyWalkPreviewPrice(walkType, wpDogCount, prices);
    onWpChange({ walkLabel: label, perWalkPrice: price });
    const dur = walkType === "60" ? 60 : walkType === "30" ? 30 : 20;
    loadWpSlots(dur);
  }

  function adjustWpDogCount(delta: number) {
    const next = Math.max(1, Math.min(customerMaxDogs, wpDogCount + delta));
    onDogCountChange(next);

    if (wp.walkLabel) {
      const walkType = wp.walkLabel.includes("60")
        ? "60"
        : wp.walkLabel.includes("30")
          ? "30"
          : "20";
      const price = weeklyWalkPreviewPrice(walkType, next, prices);
      onWpChange({ walkLabel: wp.walkLabel, perWalkPrice: price });
    }
  }

  function toggleDay(day: WalkDay, checked: boolean) {
    const next = checked
      ? [...selectedDays, day]
      : selectedDays.filter((d) => d !== day);
    onDaysChange(next);
  }

  async function handleSubmit() {
    setMsg("");
    if (!email) {
      setMsg("Please find your profile first.");
      return;
    }
    if (!wp.walkLabel) {
      setMsg("Choose a walk length.");
      return;
    }
    if (selectedDays.length < 2) {
      setMsg(
        "Weekly packages require at least 2 days. For a single walk, use the regular booking.",
      );
      return;
    }
    if (!startTime) {
      setMsg("Choose a start time.");
      return;
    }

    const { end, blockedEnd } = weeklyPackageEndTimes(startTime, wp.walkLabel);
    const weekStartVal = weekStart.trim() || nextMondayISO();
    const totalPrice = recalcWeeklyPackageTotal(
      wp.perWalkPrice,
      selectedDays.length,
    ).toFixed(2);

    setSubmitting(true);
    setMsg("Submitting…");

    try {
      const res = await fetch("/api/booking/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          walkLabel: wp.walkLabel,
          perWalkPrice: wp.perWalkPrice,
          days: selectedDays,
          start: startTime,
          end,
          blockedEnd,
          locationLabel,
          weekStart: weekStartVal,
          ownerEmail: "",
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        packageId?: number;
        weekStart?: string;
        total?: string;
        error?: string;
      };

      if (!res.ok || !data.ok) {
        setMsg(data.error || "Error creating weekly package.");
        return;
      }

      const nickname = customer?.name || email;
      const dayNames = selectedDays
        .map((d) => d.charAt(0).toUpperCase() + d.slice(1))
        .join(", ");

      let serviceAddress = "";
      let serviceLat = 0;
      let serviceLng = 0;
      let serviceMiles = 0;

      if (locationLabel === "alt" && customer?.altGeo) {
        serviceAddress = customer.altGeo.formatted || "";
        serviceLat = customer.altGeo.lat ?? 0;
        serviceLng = customer.altGeo.lng ?? 0;
        serviceMiles = customer.altGeo.miles ?? 0;
      } else if (customer?.geo) {
        serviceAddress = customer.geo.formatted || customer.address || "";
        serviceLat = customer.geo.lat ?? 0;
        serviceLng = customer.geo.lng ?? 0;
        serviceMiles = customer.geo.miles ?? 0;
      }

      const paySummaryHtml = `
        <div class="stack">
          <div><strong>Name:</strong> ${nickname}</div>
          <div><strong>Service:</strong> Weekly Package — ${wp.walkLabel}</div>
          <div><strong>Week of:</strong> ${data.weekStart || weekStartVal}</div>
          <div><strong>Days:</strong> ${dayNames}</div>
          <div><strong>Time:</strong> ${fmt12hr(startTime)} each day</div>
          <div><strong>Total:</strong> $${data.total || totalPrice}</div>
          <div class="callout" style="margin-top:8px;">Payment due by <strong>Sunday at midnight</strong>. Your walks will be confirmed after payment is verified.</div>
        </div>`;

      onSubmit({
        booking: {
          nickname,
          type: `Weekly Package — ${wp.walkLabel}`,
          price: data.total || totalPrice,
          date: data.weekStart || weekStartVal,
          start: startTime,
          end,
          blockedEnd,
          locationLabel,
          serviceAddress,
          serviceLat,
          serviceLng,
          serviceMiles,
          isWeeklyPackage: true,
          weeklyPackageId: data.packageId ?? Date.now(),
          weekDays: dayNames,
          dogCount: wpDogCount,
          buddyAddon: wpExtra,
          email,
        },
        paySummaryHtml,
      });
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error creating weekly package.");
    } finally {
      setSubmitting(false);
    }
  }

  const displayPrices = prices;

  return (
    <>
      <div className="subnav">
        <button type="button" className="btn back" onClick={onBack}>
          ←
        </button>
        <span className="icon">📅</span>
        <h2>Weekly Package</h2>
      </div>

      <div className="card stack">
        <div className="muted">
          <strong id="wpDiscountLabel">
            Save {displayPrices.weeklyDiscount}%
          </strong>{" "}
          on every walk with a weekly package! Fixed days + fixed time. Paid{" "}
          <strong>weekly in advance</strong>. Minimum 2 days per week. Payment
          cutoff: <strong>Sunday at midnight</strong>.
        </div>

        <label>Service Location</label>
        <select
          id="wpLocation"
          value={locationLabel}
          onChange={(e) => onLocationChange(e.target.value)}
        >
          <option value="primary">Primary address</option>
          {customer?.altGeo ? (
            <option value="alt">Alternate address</option>
          ) : null}
        </select>

        {customerMaxDogs >= 2 ? (
          <div
            id="wpBuddyPicker"
            style={{
              background: "rgba(30,168,112,0.08)",
              borderRadius: 10,
              padding: 12,
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
                <div style={{ fontSize: 14, fontWeight: 600 }}>🐕 How many dogs?</div>
                <div className="muted tiny" id="wpBuddyHint">
                  {wpDogCount === 1
                    ? `+$${displayPrices.buddyAddon || 10} per additional dog per walk`
                    : `${wpDogCount} dogs · +$${wpExtra} added per walk`}
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
                  onClick={() => adjustWpDogCount(-1)}
                >
                  −
                </button>
                <span
                  id="wpWalkDogCount"
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    minWidth: 24,
                    textAlign: "center",
                  }}
                >
                  {wpDogCount}
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
                  onClick={() => adjustWpDogCount(1)}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <label>Walk</label>
        <div className="row">
          <button
            type="button"
            id="wpBtn20"
            className="btn primary"
            onClick={() => wpSelectWalk("Regular 20 min", "20")}
          >
            20 min — ${weeklyWalkPreviewPrice("20", wpDogCount, displayPrices).toFixed(2)}
          </button>
          <button
            type="button"
            id="wpBtn30"
            className="btn primary"
            onClick={() => wpSelectWalk("Regular 30 min", "30")}
          >
            30 min — ${weeklyWalkPreviewPrice("30", wpDogCount, displayPrices).toFixed(2)}
          </button>
          <button
            type="button"
            id="wpBtn60"
            className="btn primary"
            onClick={() => wpSelectWalk("Regular 60 min", "60")}
          >
            60 min — ${weeklyWalkPreviewPrice("60", wpDogCount, displayPrices).toFixed(2)}
          </button>
        </div>
        <div id="wpWalkChosen" className="muted tiny">
          {wp.walkLabel
            ? `Selected: ${wp.walkLabel} ($${wp.perWalkPrice.toFixed(2)} per walk${wpDogCount > 1 ? ` · ${wpDogCount} dogs` : ""})`
            : ""}
        </div>

        <div className="hr" />
        <label>Days (fixed)</label>
        <div className="row" style={{ flexWrap: "wrap", gap: 14 }}>
          {WALK_DAYS.map(({ value, label }) => (
            <label
              key={value}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 15,
                fontWeight: 500,
              }}
            >
              <input
                type="checkbox"
                className="wpDay"
                value={value}
                checked={selectedDays.includes(value)}
                onChange={(e) => toggleDay(value, e.target.checked)}
              />{" "}
              {label}
            </label>
          ))}
        </div>

        <label>Start time (fixed)</label>
        <select
          id="wpStart"
          value={startTime}
          onChange={(e) => onStartTimeChange(e.target.value)}
        >
          <option value="">— Select time —</option>
          {slots.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <div className="hr" />
        <div className="stack">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <strong>Week starting (Monday)</strong>
            <div id="wpWeekStart" className="muted">
              {weekStart || nextMondayISO()}
            </div>
          </div>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <strong>Walks this week</strong>
            <div id="wpCount" className="muted">
              {dayCount}
            </div>
          </div>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <strong>Total due (by Sunday midnight)</strong>
            <div id="wpTotal" className="muted">
              ${total.toFixed(2)}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn primary full"
          disabled={submitting}
          onClick={handleSubmit}
        >
          Request Weekly Package
        </button>
        {msg ? (
          <div
            id="wpMsg"
            className={`muted ${msg.includes("Submitting") ? "msg-info" : msg.includes("Choose") || msg.includes("require") ? "msg-warn" : "msg-error"}`}
          >
            {msg}
          </div>
        ) : null}

        <div className="hr" />
        <div className="muted tiny">
          Mid-week pause: unused walks can be credited or refunded.
        </div>
      </div>
    </>
  );
}
