export const STORAGE_CUSTOMERS = "rdgw_customers_v1";
export const STORAGE_BOOKINGS = "rdgw_bookings_v1";
export const STORAGE_WALKERS = "rdgw_walkers_v1";
export const STORAGE_TESTIMONIALS = "rdgw_testimonials_v1";
export const STORAGE_PRICING = "rdgw_pricing_v1";
export const STORAGE_WEEKLY = "rdgw_weekly_v1";
export const STORAGE_REFUNDS = "rdgw_refunds_v1";

export type LegacyCustomer = {
  email: string;
  name?: string;
  nickname?: string;
  phone?: string;
  address?: string;
  dogs?: string;
  dogCount?: number;
  notes?: string;
  accessNotes?: string;
  adminNotes?: string;
  approved: boolean;
  meetGreet?: { date: string; time: string };
  geo?: { formatted?: string; lat?: number; lng?: number; miles?: number };
  altGeo?: { formatted?: string; lat?: number; lng?: number; miles?: number };
  waiver?: { accepted?: boolean; acceptedAt?: string; version?: string };
  createdAt?: string;
};

export type LegacyBooking = {
  id?: string | number;
  nickname?: string;
  type?: string;
  price?: number | string;
  date?: string;
  start?: string;
  end?: string;
  blockedEnd?: string;
  status?: string;
  serviceAddress?: string;
  walker_id?: number | string;
  visitNote?: string;
  pottyPee?: boolean | number | string;
  pottyPoop?: boolean | number | string;
  photo1?: string;
  photo2?: string;
  visitReportedAt?: string;
  attemptedReason?: string;
  cancelReason?: string;
  cancelType?: string;
  refundStatus?: string;
  refundAmount?: number | string;
};

export type LegacyWalker = {
  id: number;
  name: string;
  phone?: string;
};

export type LegacyTestimonial = {
  name: string;
  dogs?: string;
  text: string;
  stars: number;
};

export type LegacyWeeklyPackage = {
  weekId: number;
  nickname: string;
  walk_label: string;
  week_start: string;
  pay_status: string;
  walks_count: number;
  total_price: number;
  start_time: string;
  end_time: string;
};

export type LegacyRefund = {
  id: number;
  amount: number | string;
  method?: string;
  status: string;
  createdAt?: string;
  processedAt?: string;
  reference?: string;
  bookingDate?: string;
  bookingStart?: string;
  nickname?: string;
};

export type LegacyPrices = {
  w20: number;
  w30: number;
  w60: number;
  emergency: number;
  weeklyDiscount: number;
  buddyAddon: number;
  wp20?: number;
  wp30?: number;
  wp60?: number;
};

export const DEFAULT_PRICES: LegacyPrices = {
  w20: 29,
  w30: 35,
  w60: 49,
  emergency: 49,
  weeklyDiscount: 15,
  buddyAddon: 10,
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadCustomers(): LegacyCustomer[] {
  return readJson<LegacyCustomer[]>(STORAGE_CUSTOMERS, []);
}

export function saveCustomers(customers: LegacyCustomer[]) {
  writeJson(STORAGE_CUSTOMERS, customers);
}

export function loadBookings(): LegacyBooking[] {
  return readJson<LegacyBooking[]>(STORAGE_BOOKINGS, []);
}

export function saveBookings(bookings: LegacyBooking[]) {
  writeJson(STORAGE_BOOKINGS, bookings);
}

export function loadWalkers(): LegacyWalker[] {
  return readJson<LegacyWalker[]>(STORAGE_WALKERS, []);
}

export function saveWalkers(walkers: LegacyWalker[]) {
  writeJson(STORAGE_WALKERS, walkers);
}

export function loadTestimonials(): LegacyTestimonial[] {
  return readJson<LegacyTestimonial[]>(STORAGE_TESTIMONIALS, []);
}

export function saveTestimonials(items: LegacyTestimonial[]) {
  writeJson(STORAGE_TESTIMONIALS, items);
}

export function loadWeeklyPackages(): LegacyWeeklyPackage[] {
  return readJson<LegacyWeeklyPackage[]>(STORAGE_WEEKLY, []);
}

export function saveWeeklyPackages(items: LegacyWeeklyPackage[]) {
  writeJson(STORAGE_WEEKLY, items);
}

export function loadRefunds(): LegacyRefund[] {
  return readJson<LegacyRefund[]>(STORAGE_REFUNDS, []);
}

export function saveRefunds(items: LegacyRefund[]) {
  writeJson(STORAGE_REFUNDS, items);
}

export function loadPrices(): LegacyPrices {
  const stored = readJson<LegacyPrices | null>(STORAGE_PRICING, null);
  return stored ? { ...DEFAULT_PRICES, ...stored } : { ...DEFAULT_PRICES };
}

export function savePrices(prices: LegacyPrices) {
  writeJson(STORAGE_PRICING, prices);
}

export function nextLocalId(items: { id?: number | string }[]): number {
  const max = items.reduce((m, item) => {
    const n = typeof item.id === "number" ? item.id : parseInt(String(item.id || 0), 10);
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 0);
  return max + 1;
}
