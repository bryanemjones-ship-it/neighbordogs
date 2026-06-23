import type { LegacyPrices } from "./models";

export function fmt12hr(hhmm: string): string {
  const [h, m] = (hhmm || "00:00").split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hr}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function weeklyPrice(regular: number, discountPct: number): number {
  return +(Math.ceil(regular * (1 - discountPct / 100)) - 0.01).toFixed(2);
}

export function withWeeklyComputed(prices: LegacyPrices): LegacyPrices {
  return {
    ...prices,
    wp20: weeklyPrice(prices.w20, prices.weeklyDiscount),
    wp30: weeklyPrice(prices.w30, prices.weeklyDiscount),
    wp60: weeklyPrice(prices.w60, prices.weeklyDiscount),
  };
}

export function pricingPreview(prices: LegacyPrices): string {
  const p = withWeeklyComputed(prices);
  return `Weekly prices: 20 min = $${p.wp20?.toFixed(2)}, 30 min = $${p.wp30?.toFixed(2)}, 60 min = $${p.wp60?.toFixed(2)}`;
}

export function buddyPreview(prices: LegacyPrices): string {
  const addon = prices.buddyAddon || 0;
  const p30 = prices.w30 || 0;
  return `30-min walk: 1 dog = $${p30}, 2 dogs = $${p30 + addon}, 3 dogs = $${p30 + addon * 2}`;
}
