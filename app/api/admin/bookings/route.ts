import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/shared/lib/supabase";
import { getUserFromRequest } from "@/shared/lib/supabase-auth";
import {
  BOOKINGS_TABLE,
  rowToLegacyBooking,
  fetchBookingsForDate,
} from "@/features/booking/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json({ error: "date required" }, { status: 400 });
    }

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await fetchBookingsForDate(date, user.id);
    const bookings = rows.map(rowToLegacyBooking);

    return NextResponse.json({ ok: true, bookings });
  } catch (error) {
    console.error("[admin/bookings] GET error", error);
    const message =
      error instanceof Error ? error.message : "Could not load bookings.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      id?: string;
      walker_id?: string | null;
      status?: string;
      cancelReason?: string;
    };

    if (!body.id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();
    const updates: Record<string, unknown> = {};

    if (body.walker_id !== undefined) {
      updates.walker_id = body.walker_id || null;
    }
    if (body.status) {
      updates.status = body.status;
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json(
        { error: "No updatable fields provided" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from(BOOKINGS_TABLE)
      .update(updates)
      .eq("id", body.id)
      .eq("operator_id", user.id)
      .select("id, status, walker_id")
      .single();

    if (error) {
      console.error("[admin/bookings] PATCH error", error);
      return NextResponse.json(
        { error: error.message || "Could not update booking." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, booking: data });
  } catch (error) {
    console.error("[admin/bookings] PATCH error", error);
    const message =
      error instanceof Error ? error.message : "Could not update booking.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
