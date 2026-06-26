import { NextResponse } from "next/server";
import {
  createWalkCheckoutSession,
  WalkCheckoutError,
} from "@/features/billing/lib/walk-checkout";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    const result = await createWalkCheckoutSession({
      operatorSlug:
        typeof body.operatorSlug === "string" ? body.operatorSlug : undefined,
      operatorId:
        typeof body.operatorId === "string" ? body.operatorId : undefined,
      walkType: String(body.walkType || ""),
      dogCount: Number(body.dogCount ?? 1),
      nickname: String(body.nickname || ""),
      email: typeof body.email === "string" ? body.email : undefined,
      type: String(body.type || ""),
      date: String(body.date || ""),
      start: String(body.start || ""),
      end: typeof body.end === "string" ? body.end : undefined,
      blockedEnd:
        typeof body.blockedEnd === "string" ? body.blockedEnd : undefined,
      locationLabel:
        typeof body.locationLabel === "string" ? body.locationLabel : undefined,
      serviceAddress:
        typeof body.serviceAddress === "string"
          ? body.serviceAddress
          : undefined,
      serviceLat:
        typeof body.serviceLat === "number" ? body.serviceLat : undefined,
      serviceLng:
        typeof body.serviceLng === "number" ? body.serviceLng : undefined,
      serviceMiles:
        typeof body.serviceMiles === "number" ? body.serviceMiles : undefined,
      isEmergency: body.isEmergency === true,
    });

    return NextResponse.json({
      ok: true,
      url: result.url,
      bookingId: result.bookingId,
    });
  } catch (error) {
    if (error instanceof WalkCheckoutError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("[booking/checkout] error", error);
    return NextResponse.json(
      { error: "Could not start checkout." },
      { status: 500 },
    );
  }
}
