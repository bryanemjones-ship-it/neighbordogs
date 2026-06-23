import { NextResponse } from "next/server";
import { previewTerritory } from "@/features/territory/lib/territory-preview";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const address = typeof body?.address === "string" ? body.address.trim() : "";

    console.log("[territory-preview] POST request:", {
      address: address || undefined,
      lat: typeof body?.lat === "number" ? body.lat : undefined,
      lng: typeof body?.lng === "number" ? body.lng : undefined,
      state: typeof body?.state === "string" ? body.state : undefined,
      county: typeof body?.county === "string" ? body.county : undefined,
    });

    if (!address && typeof body?.lat !== "number") {
      return NextResponse.json({ error: "address required" }, { status: 400 });
    }

    const result = await previewTerritory({
      address,
      lat: typeof body?.lat === "number" ? body.lat : undefined,
      lng: typeof body?.lng === "number" ? body.lng : undefined,
      state: typeof body?.state === "string" ? body.state : undefined,
      county: typeof body?.county === "string" ? body.county : undefined,
      formatted: typeof body?.formatted === "string" ? body.formatted : undefined,
    });

    console.log("[territory-preview] POST success:", {
      anchor_address: result.anchor_address,
      estimated_homes: result.estimated_homes,
      radius_miles: result.radius_miles,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Territory preview failed";

    if (
      message === "address required" ||
      message === "Could not resolve county for this address" ||
      message === "No housing data for this area"
    ) {
      console.log("[territory-preview] POST failed (400):", message);
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("territory-preview error", error);
    return NextResponse.json({ error: "Territory preview failed" }, { status: 500 });
  }
}
