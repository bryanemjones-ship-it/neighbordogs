export type BookingStep = "select" | "schedule" | "weekly" | "pay";

export type WalkDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export const WALK_DAYS: { value: WalkDay; label: string }[] = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" },
];

export type WeeklyPackageDraft = {
  walkLabel: string;
  perWalkPrice: number;
};

export type BookingDraft = {
  email?: string;
  nickname: string;
  type: string;
  price: number | string;
  locationLabel: string;
  dogCount: number;
  buddyAddon: number;
  serviceAddress?: string;
  serviceLat?: number;
  serviceLng?: number;
  serviceMiles?: number;
  date?: string;
  start?: string;
  end?: string;
  blockedEnd?: string;
  isWeeklyPackage?: boolean;
  weeklyPackageId?: number | string;
  weekDays?: string;
  isEmergency?: boolean;
};

export type SlotOption = {
  value: string;
  label: string;
};

export type PayMethodId = "venmo" | "cashapp" | "zelle";

export type SingleBookingPayload = {
  nickname: string;
  type: string;
  price: number | string;
  date: string;
  start: string;
  end: string;
  blockedEnd: string;
  locationLabel: string;
  serviceAddress: string;
  serviceLat: number;
  serviceLng: number;
  serviceMiles: number;
  holdMinutes: number;
  ownerEmail: string;
  dogCount: number;
  buddyAddon: number;
  email?: string;
};

export type WeeklyPackagePayload = {
  email: string;
  walkLabel: string;
  perWalkPrice: number;
  days: WalkDay[];
  start: string;
  end: string;
  blockedEnd: string;
  locationLabel: string;
  weekStart: string;
  ownerEmail: string;
};
