import { parseHHMM, fmtHHMM, walkDurationFromLabel } from "./time-utils";

export const OP_START = "08:00";
export const OP_END = "18:00";
export const SLOT_INCREMENT_MIN = 30;
export const BUFFER_MIN = 15;

export type TimeRange = {
  start: string;
  end: string;
};

export type DbBookingInterval = {
  start_time: string;
  end_time: string;
  blocked_end_time: string;
};

export function normalizeTime(value: string): string {
  if (!value) return "00:00";
  const parts = value.split(":");
  return `${parts[0]?.padStart(2, "0")}:${parts[1]?.padStart(2, "0")}`;
}

export function generateOperatingSlots(): string[] {
  const startMin = parseHHMM(OP_START);
  const endMin = parseHHMM(OP_END);
  const slots: string[] = [];

  for (let m = startMin; m < endMin; m += SLOT_INCREMENT_MIN) {
    slots.push(fmtHHMM(m));
  }

  return slots;
}

function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function bookingToBlockedRange(row: DbBookingInterval): TimeRange {
  const start = normalizeTime(row.start_time);
  const blockedEnd = normalizeTime(
    row.blocked_end_time || row.end_time,
  );
  return { start, end: blockedEnd };
}

export function slotRangeForWalk(
  slotStart: string,
  walkType: string,
): TimeRange {
  let duration: number;
  if (walkType === "emergency") {
    duration = 20;
  } else if (walkType === "60") {
    duration = 60;
  } else if (walkType === "30") {
    duration = 30;
  } else if (walkType === "mg") {
    duration = 15;
  } else {
    duration = 20;
  }

  const startMin = parseHHMM(slotStart);
  const endMin = startMin + duration;
  const blockedEndMin = endMin + BUFFER_MIN;

  return {
    start: slotStart,
    end: fmtHHMM(blockedEndMin),
  };
}

export function slotRangeForWalkLabel(
  slotStart: string,
  walkLabel: string,
): TimeRange {
  const duration = walkDurationFromLabel(walkLabel);
  const startMin = parseHHMM(slotStart);
  const blockedEndMin = startMin + duration + BUFFER_MIN;
  return {
    start: slotStart,
    end: fmtHHMM(blockedEndMin),
  };
}

export function filterAvailableSlots(
  allSlots: string[],
  existing: DbBookingInterval[],
  walkType: string,
): string[] {
  const blocked = existing.map(bookingToBlockedRange);

  return allSlots.filter((slot) => {
    const candidate = slotRangeForWalk(slot, walkType);
    const cStart = parseHHMM(candidate.start);
    const cEnd = parseHHMM(candidate.end);

    return !blocked.some((b) => {
      const bStart = parseHHMM(b.start);
      const bEnd = parseHHMM(b.end);
      return rangesOverlap(cStart, cEnd, bStart, bEnd);
    });
  });
}

export const DAY_OFFSET: Record<string, number> = {
  mon: 0,
  tue: 1,
  wed: 2,
  thu: 3,
  fri: 4,
  sat: 5,
  sun: 6,
};

export function datesForWeeklyDays(
  weekStartISO: string,
  days: string[],
): string[] {
  const monday = new Date(`${weekStartISO}T12:00:00`);
  return days.map((day) => {
    const offset = DAY_OFFSET[day] ?? 0;
    const d = new Date(monday);
    d.setDate(monday.getDate() + offset);
    return d.toISOString().slice(0, 10);
  });
}
