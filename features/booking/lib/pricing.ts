import {
  DEFAULT_PRICES,
  type LegacyPrices,
} from "@/features/booking/lib/models";
import { withWeeklyComputed } from "@/features/booking/lib/pricing-helpers";
import { addMinHHMM, walkDurationFromLabel } from "./time-utils";

export function resolvePrices(stored?: Partial<LegacyPrices> | null): LegacyPrices {
  const merged = { ...DEFAULT_PRICES, ...stored };
  return withWeeklyComputed(merged);
}

export function buddyAddonTotal(dogCount: number, prices: LegacyPrices): number {
  return (dogCount - 1) * (prices.buddyAddon || 10);
}

export function regularWalkPreviewPrice(
  walkType: "20" | "30" | "60",
  dogCount: number,
  prices: LegacyPrices,
): number {
  const base =
    walkType === "60"
      ? prices.w60
      : walkType === "30"
        ? prices.w30
        : prices.w20;
  return base + buddyAddonTotal(dogCount, prices);
}

export function weeklyWalkPreviewPrice(
  walkType: "20" | "30" | "60",
  dogCount: number,
  prices: LegacyPrices,
): number {
  const computed = resolvePrices(prices);
  const base =
    walkType === "60"
      ? computed.wp60 || 0
      : walkType === "30"
        ? computed.wp30 || 0
        : computed.wp20 || 0;
  return +(base + buddyAddonTotal(dogCount, prices)).toFixed(2);
}

/** Legacy `recalcWeeklyPackage()` — total due for checked days. */
export function recalcWeeklyPackageTotal(
  perWalkPrice: number,
  dayCount: number,
): number {
  return +((perWalkPrice || 0) * dayCount).toFixed(2);
}

export type ValidateBookingInput = {
  date: string;
  start: string;
  walkType: string;
  dogCount?: number;
  isEmergency?: boolean;
};

export type ValidateBookingResult = {
  valid: boolean;
  price?: number;
  end?: string;
  blockedEnd?: string;
  buddyAddon?: number;
  error?: string;
};

export function validateBookingPrice(
  input: ValidateBookingInput,
  prices: LegacyPrices = DEFAULT_PRICES,
): ValidateBookingResult {
  const { date, start, walkType, dogCount = 1, isEmergency = false } = input;

  if (!date) {
    return { valid: false, error: "Please choose a date." };
  }
  if (!start) {
    return { valid: false, error: "Please choose a time." };
  }

  const resolved = resolvePrices(prices);
  const buddyAddon = buddyAddonTotal(dogCount, resolved);

  let base: number;
  let duration: number;

  if (isEmergency || walkType === "emergency") {
    base = resolved.emergency;
    duration = 20;
  } else if (walkType === "60") {
    base = resolved.w60;
    duration = 60;
  } else if (walkType === "30") {
    base = resolved.w30;
    duration = 30;
  } else {
    base = resolved.w20;
    duration = 20;
  }

  const price = +(base + buddyAddon).toFixed(2);
  const end = addMinHHMM(start, duration);
  const blockedEnd = addMinHHMM(end, 15);

  return { valid: true, price, end, blockedEnd, buddyAddon };
}

export function weeklyPackageEndTimes(start: string, walkLabel: string) {
  const dur = walkDurationFromLabel(walkLabel);
  const end = addMinHHMM(start, dur);
  const blockedEnd = addMinHHMM(end, 15);
  return { end, blockedEnd, dur };
}
