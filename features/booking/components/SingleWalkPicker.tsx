"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BookingDraft, SlotOption } from "@/features/booking/lib/types";
import {
  defaultScheduleDateISO,
  walkTypeFromLabel,
  fmt12hr,
} from "@/features/booking/lib/time-utils";

type SingleWalkPickerProps = {
  booking: BookingDraft;
  date: string;
  time: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onConfirm: (validated: {
    date: string;
    start: string;
    end: string;
    blockedEnd: string;
    price: number;
  }) => void;
  onBack: () => void;
};

export function SingleWalkPicker({
  booking,
  date,
  time,
  onDateChange,
  onTimeChange,
  onConfirm,
  onBack,
}: SingleWalkPickerProps) {
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [submitMsg, setSubmitMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const renderVersion = useRef(0);

  const rulesText = booking.isEmergency
    ? "Emergency walks: same-day allowed (limited window)."
    : "Regular walks must be booked by midnight prior to service.";

  const loadSlots = useCallback(async (dateISO: string) => {
    const myVersion = ++renderVersion.current;
    if (!dateISO) {
      setSlots([]);
      setMessage("");
      return;
    }

    const walkType = walkTypeFromLabel(booking.type, booking.isEmergency);
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(
        `/api/booking/slots?date=${encodeURIComponent(dateISO)}&walkType=${walkType}`,
      );
      const data = (await res.json()) as {
        slots?: SlotOption[];
        message?: string;
      };

      if (myVersion !== renderVersion.current) return;

      if (data.message && !data.slots?.length) {
        setSlots([]);
        setMessage(data.message);
        return;
      }

      const options = data.slots || [];
      if (!options.length) {
        setSlots([]);
        setMessage("No openings. Try another date.");
        return;
      }

      setSlots(options);
      setMessage("");
    } catch {
      if (myVersion === renderVersion.current) {
        setSlots([]);
        setMessage("Error loading slots");
      }
    } finally {
      if (myVersion === renderVersion.current) setLoading(false);
    }
  }, [booking.type, booking.isEmergency]);

  useEffect(() => {
    const initial = date || defaultScheduleDateISO(!!booking.isEmergency);
    if (!date) onDateChange(initial);
  }, [booking.isEmergency, date, onDateChange]);

  useEffect(() => {
    if (date) loadSlots(date);
  }, [date, loadSlots]);

  async function handleConfirm() {
    setSubmitMsg("");
    if (!date) {
      setSubmitMsg("Please choose a date.");
      return;
    }
    if (!time) {
      setSubmitMsg("Please choose a time.");
      return;
    }

    const walkType = walkTypeFromLabel(booking.type, booking.isEmergency);
    setSubmitting(true);
    setSubmitMsg("Checking availability...");

    try {
      const res = await fetch("/api/booking/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          start: time,
          walkType,
          dogCount: booking.dogCount || 1,
          isEmergency: !!booking.isEmergency,
          isWeekly: false,
        }),
      });

      const result = (await res.json()) as {
        valid?: boolean;
        price?: number;
        end?: string;
        blockedEnd?: string;
        error?: string;
      };

      if (!result.valid) {
        setSubmitMsg(result.error || "This slot is not available.");
        return;
      }

      setSubmitMsg("");
      onConfirm({
        date,
        start: time,
        end: result.end!,
        blockedEnd: result.blockedEnd!,
        price: result.price!,
      });
    } catch (e) {
      setSubmitMsg(
        e instanceof Error ? e.message : "Could not validate booking.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="subnav">
        <button type="button" className="btn back" onClick={onBack}>
          ←
        </button>
        <span className="icon">📅</span>
        <h2>Pick a Date &amp; Time</h2>
      </div>

      <div className="card stack">
        <div className="muted">
          Pick a date and an available time. We automatically leave{" "}
          <strong>15 minutes</strong> between appointments.
        </div>
        <div className="two">
          <div className="stack">
            <label>Date</label>
            <input
              id="bkDate"
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
            />
          </div>
          <div className="stack">
            <label>Available times</label>
            <select
              id="bkTime"
              value={time}
              onChange={(e) => onTimeChange(e.target.value)}
              disabled={loading || !slots.length}
            >
              {loading ? (
                <option value="">Loading...</option>
              ) : !date ? (
                <option value="">Select a date first</option>
              ) : !slots.length ? (
                <option value="">No times available</option>
              ) : (
                <>
                  <option value="">— Select time —</option>
                  {slots.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
        </div>
        <div className="muted tiny">{rulesText}</div>
        {message ? <div className="muted tiny">{message}</div> : null}
        <button
          type="button"
          className="btn primary full"
          disabled={submitting}
          onClick={handleConfirm}
        >
          Continue to Payment
        </button>
        {submitMsg ? (
          <div
            className={`muted ${submitMsg.includes("Checking") ? "msg-info" : submitMsg.includes("Please") ? "msg-warn" : "msg-error"}`}
          >
            {submitMsg}
          </div>
        ) : null}
        {booking.type ? (
          <div className="muted tiny">
            {booking.type}
            {booking.start ? ` · ${fmt12hr(booking.start)}` : ""}
          </div>
        ) : null}
      </div>
    </>
  );
}
