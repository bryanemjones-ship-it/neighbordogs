import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/shared/lib/supabase";
import type {
  SingleBookingPayload,
  WalkDay,
  WeeklyPackagePayload,
} from "@/features/booking/lib/types";
import {
  BOOKINGS_TABLE,
  dollarsToCents,
  findCustomerByEmail,
} from "@/features/booking/lib/db";
import { datesForWeeklyDays } from "@/features/booking/lib/slots";

function isWeeklyPayload(
  body: Record<string, unknown>,
): body is WeeklyPackagePayload {
  return Array.isArray(body.days) && typeof body.walkLabel === "string";
}

type BookingInsert = {
  customer_id: string | null;
  customer_name: string;
  customer_email: string;
  type: string;
  date: string;
  start_time: string;
  end_time: string;
  blocked_end_time: string;
  price_cents: number;
  status: string;
  is_emergency: boolean;
  is_weekly_package: boolean;
  service_address: string | null;
  location_label: string;
  dog_count: number;
  buddy_addon_cents: number;
  test_flag: boolean;
};

function buildInsertRow(
  base: {
    customer_id: string | null;
    customer_name: string;
    customer_email: string;
    type: string;
    date: string;
    start_time: string;
    end_time: string;
    blocked_end_time: string;
    priceCents: number;
    status: string;
    is_emergency: boolean;
    is_weekly_package: boolean;
    service_address: string | null;
    location_label: string;
    dog_count: number;
    buddy_addon_cents: number;
  },
): BookingInsert {
  return {
    customer_id: base.customer_id,
    customer_name: base.customer_name,
    customer_email: base.customer_email,
    type: base.type,
    date: base.date,
    start_time: base.start_time,
    end_time: base.end_time,
    blocked_end_time: base.blocked_end_time,
    price_cents: base.priceCents,
    status: base.status,
    is_emergency: base.is_emergency,
    is_weekly_package: base.is_weekly_package,
    service_address: base.service_address,
    location_label: base.location_label,
    dog_count: base.dog_count,
    buddy_addon_cents: base.buddy_addon_cents,
    test_flag: true,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const supabase = createSupabaseServerClient();

    if (isWeeklyPayload(body)) {
      const payload: WeeklyPackagePayload = {
        email: String(body.email || ""),
        walkLabel: String(body.walkLabel),
        perWalkPrice: Number(body.perWalkPrice),
        days: body.days as WalkDay[],
        start: String(body.start),
        end: String(body.end),
        blockedEnd: String(body.blockedEnd),
        locationLabel: String(body.locationLabel || "primary"),
        weekStart: String(body.weekStart),
        ownerEmail: String(body.ownerEmail || ""),
      };

      if (!payload.email) {
        return NextResponse.json({ error: "email required" }, { status: 400 });
      }
      if (payload.days.length < 2) {
        return NextResponse.json(
          { error: "Weekly packages require at least 2 days." },
          { status: 400 },
        );
      }

      const customer = await findCustomerByEmail(payload.email);
      if (!customer) {
        return NextResponse.json(
          { error: "Customer not found." },
          { status: 400 },
        );
      }

      const walkDates = datesForWeeklyDays(payload.weekStart, payload.days);
      const perWalkCents = dollarsToCents(payload.perWalkPrice);
      const type = `Weekly Package — ${payload.walkLabel}`;

      const rows: BookingInsert[] = walkDates.map((date) =>
        buildInsertRow({
          customer_id: customer.id,
          customer_name: customer.name || payload.email,
          customer_email: payload.email,
          type,
          date,
          start_time: payload.start,
          end_time: payload.end,
          blocked_end_time: payload.blockedEnd,
          priceCents: perWalkCents,
          status: "pending",
          is_emergency: false,
          is_weekly_package: true,
          service_address: null,
          location_label: payload.locationLabel,
          dog_count: 1,
          buddy_addon_cents: 0,
        }),
      );

      const { data, error } = await supabase
        .from(BOOKINGS_TABLE)
        .insert(rows)
        .select("id");

      if (error) {
        console.error("[booking/request] weekly insert error", error);
        return NextResponse.json(
          { error: error.message || "Could not create weekly package." },
          { status: 500 },
        );
      }

      const total = +(payload.perWalkPrice * payload.days.length).toFixed(2);
      const packageId = data?.[0]?.id;

      return NextResponse.json({
        ok: true,
        packageId,
        weekStart: payload.weekStart,
        total: total.toFixed(2),
        bookingIds: data?.map((r) => r.id) ?? [],
      });
    }

    const payload: SingleBookingPayload = {
      nickname: String(body.nickname || ""),
      type: String(body.type || ""),
      price: body.price as number | string,
      date: String(body.date || ""),
      start: String(body.start || ""),
      end: String(body.end || ""),
      blockedEnd: String(body.blockedEnd || body.end || ""),
      locationLabel: String(body.locationLabel || "primary"),
      serviceAddress: String(body.serviceAddress || ""),
      serviceLat: Number(body.serviceLat || 0),
      serviceLng: Number(body.serviceLng || 0),
      serviceMiles: Number(body.serviceMiles || 999),
      holdMinutes: Number(body.holdMinutes ?? 30),
      ownerEmail: String(body.ownerEmail || ""),
      dogCount: Number(body.dogCount ?? 1),
      buddyAddon: Number(body.buddyAddon ?? 0),
      email: body.email ? String(body.email) : undefined,
    };

    if (!payload.date || !payload.start) {
      return NextResponse.json(
        { error: "date and start are required" },
        { status: 400 },
      );
    }

    let customerId: string | null = null;
    let customerEmail = payload.email || "";

    if (customerEmail) {
      const customer = await findCustomerByEmail(customerEmail);
      if (customer) {
        customerId = customer.id;
        customerEmail = customer.email;
      }
    }

    const row = buildInsertRow({
      customer_id: customerId,
      customer_name: payload.nickname,
      customer_email: customerEmail,
      type: payload.type,
      date: payload.date,
      start_time: payload.start,
      end_time: payload.end,
      blocked_end_time: payload.blockedEnd,
      priceCents: dollarsToCents(payload.price),
      status: "pending",
      is_emergency: payload.type.toLowerCase().includes("emergency"),
      is_weekly_package: false,
      service_address: payload.serviceAddress || null,
      location_label: payload.locationLabel,
      dog_count: payload.dogCount,
      buddy_addon_cents: dollarsToCents(payload.buddyAddon),
    });

    const { data, error } = await supabase
      .from(BOOKINGS_TABLE)
      .insert(row)
      .select("id")
      .single();

    if (error) {
      console.error("[booking/request] insert error", error);
      return NextResponse.json(
        { error: error.message || "Could not submit booking request." },
        { status: 500 },
      );
    }

    const bookingId = data.id;

    return NextResponse.json({
      ok: true,
      bookingId,
      approveUrl: `/dashboard?approve=${bookingId}`,
      rejectUrl: `/dashboard?reject=${bookingId}`,
    });
  } catch (error) {
    console.error("[booking/request] error", error);
    const message =
      error instanceof Error ? error.message : "Could not submit booking request.";

    if (message === "Supabase is not configured") {
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
