import { createSupabaseServerClient } from "@/shared/lib/supabase";
import type { LegacyBooking } from "@/features/booking/lib/models";
import { normalizeTime } from "./slots";

export const BOOKINGS_TABLE = "bookings";
export const CUSTOMERS_TABLE = "test_demo_customers";
export const WALKERS_TABLE = "test_demo_walkers";

export const CANCELLED_STATUSES = [
  "cancelled",
  "cancelled_by_customer",
  "cancelled_by_provider",
];

export type BookingRow = {
  id: string;
  customer_id: string | null;
  walker_id: string | null;
  customer_name: string | null;
  customer_email?: string | null;
  type: string;
  date: string;
  start_time: string;
  end_time: string;
  blocked_end_time?: string;
  price_cents: number;
  status: string;
  is_emergency: boolean;
  is_weekly_package?: boolean;
  service_address?: string | null;
  location_label?: string | null;
  dog_count?: number;
  buddy_addon_cents?: number;
  created_at?: string;
};

export function dollarsToCents(amount: number | string): number {
  return Math.round(Number(amount) * 100);
}

export function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function rowToLegacyBooking(row: BookingRow): LegacyBooking {
  return {
    id: row.id,
    nickname: row.customer_name || undefined,
    type: row.type,
    price: centsToDollars(row.price_cents),
    date: row.date,
    start: normalizeTime(row.start_time),
    end: normalizeTime(row.end_time),
    blockedEnd: normalizeTime(row.blocked_end_time || row.end_time),
    status: row.status,
    serviceAddress: row.service_address || undefined,
    walker_id: row.walker_id || undefined,
  };
}

export async function findCustomerByEmail(email: string) {
  const supabase = createSupabaseServerClient();
  const normalized = email.trim().toLowerCase();

  const { data, error } = await supabase
    .from(CUSTOMERS_TABLE)
    .select("id, email, name, approved")
    .eq("test_flag", true)
    .ilike("email", normalized)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function fetchBookingsForDate(
  date: string,
  operatorId?: string,
) {
  const supabase = createSupabaseServerClient();

  let query = supabase
    .from(BOOKINGS_TABLE)
    .select(
      "id, customer_id, walker_id, customer_name, type, date, start_time, end_time, price_cents, status, is_emergency, created_at",
    )
    .eq("date", date);

  if (operatorId) {
    query = query.eq("operator_id", operatorId);
  }

  const { data, error } = await query.order("start_time", { ascending: true });

  if (error) throw error;

  return (data || [])
    .filter((row) => !CANCELLED_STATUSES.includes(row.status))
    .map((row) => ({
      ...row,
      blocked_end_time: row.end_time,
    })) as BookingRow[];
}
