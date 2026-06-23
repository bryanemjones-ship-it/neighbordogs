"use client";

import type {
  BookingDraft,
  BookingStep,
  PayMethodId,
  WalkDay,
  WeeklyPackageDraft,
} from "@/features/booking/lib/types";

export type BookingFunnelState = {
  step: BookingStep;
  booking: BookingDraft | null;
  wp: WeeklyPackageDraft;
  customerEmail: string;
  customerName: string;
  locationLabel: string;
  dogCount: number;
  wpDogCount: number;
  wpSelectedDays: WalkDay[];
  wpStartTime: string;
  wpWeekStart: string;
  scheduleDate: string;
  scheduleTime: string;
  selectedPayMethod: PayMethodId;
  paySummaryHtml: string | null;
  successMessage: string | null;
};

export type BookingAction =
  | { type: "SET_CUSTOMER"; email: string; name: string; locationLabel?: string }
  | { type: "SET_LOCATION"; locationLabel: string }
  | { type: "SET_DOG_COUNT"; dogCount: number }
  | { type: "SET_WP_DOG_COUNT"; dogCount: number }
  | { type: "START_WALK"; booking: BookingDraft }
  | { type: "GO_SCHEDULE"; scheduleDate: string }
  | { type: "SET_SCHEDULE_DATE"; date: string }
  | { type: "SET_SCHEDULE_TIME"; time: string }
  | {
      type: "CONFIRM_SCHEDULE";
      date: string;
      start: string;
      end: string;
      blockedEnd: string;
      price: number;
    }
  | { type: "OPEN_WEEKLY"; wpWeekStart: string }
  | { type: "SET_WP"; wp: WeeklyPackageDraft }
  | { type: "SET_WP_DAYS"; days: WalkDay[] }
  | { type: "SET_WP_START"; start: string }
  | { type: "SET_WP_WEEK_START"; weekStart: string }
  | {
      type: "SUBMIT_WEEKLY";
      booking: BookingDraft;
      paySummaryHtml: string;
    }
  | { type: "GO_PAY"; paySummaryHtml?: string }
  | { type: "SET_PAY_METHOD"; method: PayMethodId }
  | { type: "SET_STEP"; step: BookingStep }
  | { type: "SET_SUCCESS"; message: string }
  | { type: "RESET" };

export const initialBookingState: BookingFunnelState = {
  step: "select",
  booking: null,
  wp: { walkLabel: "", perWalkPrice: 0 },
  customerEmail: "",
  customerName: "",
  locationLabel: "primary",
  dogCount: 1,
  wpDogCount: 1,
  wpSelectedDays: [],
  wpStartTime: "",
  wpWeekStart: "",
  scheduleDate: "",
  scheduleTime: "",
  selectedPayMethod: "venmo",
  paySummaryHtml: null,
  successMessage: null,
};

export function bookingReducer(
  state: BookingFunnelState,
  action: BookingAction,
): BookingFunnelState {
  switch (action.type) {
    case "SET_CUSTOMER":
      return {
        ...state,
        customerEmail: action.email,
        customerName: action.name,
        locationLabel: action.locationLabel ?? state.locationLabel,
      };
    case "SET_LOCATION":
      return { ...state, locationLabel: action.locationLabel };
    case "SET_DOG_COUNT":
      return { ...state, dogCount: action.dogCount };
    case "SET_WP_DOG_COUNT":
      return { ...state, wpDogCount: action.dogCount };
    case "START_WALK":
      return {
        ...state,
        booking: action.booking,
        step: "schedule",
        scheduleTime: "",
      };
    case "GO_SCHEDULE":
      return {
        ...state,
        step: "schedule",
        scheduleDate: action.scheduleDate,
        scheduleTime: "",
      };
    case "SET_SCHEDULE_DATE":
      return { ...state, scheduleDate: action.date, scheduleTime: "" };
    case "SET_SCHEDULE_TIME":
      return { ...state, scheduleTime: action.time };
    case "CONFIRM_SCHEDULE":
      return {
        ...state,
        booking: state.booking
          ? {
              ...state.booking,
              date: action.date,
              start: action.start,
              end: action.end,
              blockedEnd: action.blockedEnd,
              price: action.price,
            }
          : null,
        step: "pay",
        selectedPayMethod: "venmo",
        paySummaryHtml: null,
      };
    case "OPEN_WEEKLY":
      return {
        ...state,
        step: "weekly",
        wp: { walkLabel: "", perWalkPrice: 0 },
        wpSelectedDays: [],
        wpStartTime: "",
        wpWeekStart: action.wpWeekStart,
        wpDogCount: 1,
      };
    case "SET_WP":
      return { ...state, wp: action.wp };
    case "SET_WP_DAYS":
      return { ...state, wpSelectedDays: action.days };
    case "SET_WP_START":
      return { ...state, wpStartTime: action.start };
    case "SET_WP_WEEK_START":
      return { ...state, wpWeekStart: action.weekStart };
    case "SUBMIT_WEEKLY":
      return {
        ...state,
        booking: action.booking,
        step: "pay",
        selectedPayMethod: "venmo",
        paySummaryHtml: action.paySummaryHtml,
      };
    case "GO_PAY":
      return {
        ...state,
        step: "pay",
        selectedPayMethod: "venmo",
        paySummaryHtml: action.paySummaryHtml ?? state.paySummaryHtml,
      };
    case "SET_PAY_METHOD":
      return { ...state, selectedPayMethod: action.method };
    case "SET_STEP":
      return {
        ...state,
        step: action.step,
        ...(action.step === "select"
          ? {
              booking: null,
              scheduleDate: "",
              scheduleTime: "",
              paySummaryHtml: null,
            }
          : {}),
      };
    case "SET_SUCCESS":
      return { ...state, successMessage: action.message };
    case "RESET":
      return { ...initialBookingState };
    default:
      return state;
  }
}
