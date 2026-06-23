export function parseHHMM(hhmm: string): number {
  const [h, m] = (hhmm || "00:00").split(":").map(Number);
  return h * 60 + (m || 0);
}

export function fmtHHMM(mins: number): string {
  return (
    String(Math.floor(mins / 60)).padStart(2, "0") +
    ":" +
    String(mins % 60).padStart(2, "0")
  );
}

export function addMinHHMM(hhmm: string, mins: number): string {
  return fmtHHMM(parseHHMM(hhmm) + mins);
}

export function fmt12hr(hhmm: string): string {
  const [h, m] = (hhmm || "00:00").split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hr}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function nextMondayISO(from = new Date()): string {
  const d = new Date(from);
  const day = d.getDay();
  const diff = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
  const nm = new Date(d);
  nm.setDate(d.getDate() + diff);
  return nm.toISOString().slice(0, 10);
}

export function defaultScheduleDateISO(isEmergency = false): string {
  const d = new Date();
  if (!isEmergency) d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function walkTypeFromLabel(type: string, isEmergency = false): string {
  if (isEmergency) return "emergency";
  if (type.includes("60")) return "60";
  if (type.includes("30")) return "30";
  return "20";
}

export function walkDurationFromLabel(label: string): number {
  if (label.includes("60")) return 60;
  if (label.includes("30")) return 30;
  return 20;
}

export const BUFFER_MIN = 15;
export const HOLD_MIN = 30;
