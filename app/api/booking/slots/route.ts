import { NextResponse } from "next/server";
import { fetchBookingsForDate } from "@/features/booking/lib/db";
import {
  filterAvailableSlots,
  generateOperatingSlots,
} from "@/features/booking/lib/slots";
import { fmt12hr } from "@/features/booking/lib/time-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const walkType = searchParams.get("walkType") || "30";

    if (!date) {
      return NextResponse.json(
        { slots: [], message: "Select a date first" },
        { status: 400 },
      );
    }

    const existing = await fetchBookingsForDate(date);
    const allSlots = generateOperatingSlots();
    const available = filterAvailableSlots(allSlots, existing, walkType);

    if (!available.length) {
      return NextResponse.json({
        slots: [],
        message: "No openings. Try another date.",
      });
    }

    const slots = available.map((value) => ({
      value,
      label: fmt12hr(value),
    }));

    return NextResponse.json({ slots });
  } catch (error) {
    console.error("[booking/slots] error", error);
    const message =
      error instanceof Error ? error.message : "Could not load time slots.";
    return NextResponse.json(
      { slots: [], message },
      { status: 500 },
    );
  }
}
