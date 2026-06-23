import { NextResponse } from "next/server";
import { validateBookingPrice } from "@/features/booking/lib/pricing";
import { fetchBookingsForDate } from "@/features/booking/lib/db";
import {
  filterAvailableSlots,
  generateOperatingSlots,
} from "@/features/booking/lib/slots";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      date?: string;
      start?: string;
      walkType?: string;
      dogCount?: number;
      isEmergency?: boolean;
      isWeekly?: boolean;
    };

    const result = validateBookingPrice({
      date: body.date || "",
      start: body.start || "",
      walkType: body.walkType || "20",
      dogCount: body.dogCount ?? 1,
      isEmergency: body.isEmergency ?? false,
    });

    if (!result.valid) {
      return NextResponse.json(result, { status: 400 });
    }

    if (body.date && body.start && !body.isWeekly) {
      const existing = await fetchBookingsForDate(body.date);
      const available = filterAvailableSlots(
        generateOperatingSlots(),
        existing,
        body.walkType || "20",
      );

      if (!available.includes(body.start)) {
        return NextResponse.json(
          {
            valid: false,
            error: "This slot is not available.",
          },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[booking/validate] error", error);
    return NextResponse.json(
      { valid: false, error: "Could not validate booking." },
      { status: 500 },
    );
  }
}
