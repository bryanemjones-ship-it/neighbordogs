import { NextResponse } from "next/server";
import { createTerritoryCheckoutSession } from "@/features/billing/lib/territory-checkout";
import {
  reserveExistingTerritoryForCheckout,
  reserveTerritoryForCheckout,
  TerritoryReserveError,
} from "@/features/territory/lib/territory-reserve";
import { getUserFromRequest } from "@/shared/lib/supabase-auth";

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const territoryId =
      typeof body?.territory_id === "string" ? body.territory_id.trim() : "";

    let reserved;
    if (territoryId) {
      reserved = await reserveExistingTerritoryForCheckout(user.id, territoryId);
    } else {
      const address = typeof body?.address === "string" ? body.address.trim() : "";
      if (!address && typeof body?.lat !== "number") {
        return NextResponse.json({ error: "address or territory_id required" }, { status: 400 });
      }

      reserved = await reserveTerritoryForCheckout(user.id, {
        address,
        lat: typeof body?.lat === "number" ? body.lat : undefined,
        lng: typeof body?.lng === "number" ? body.lng : undefined,
        state: typeof body?.state === "string" ? body.state : undefined,
        county: typeof body?.county === "string" ? body.county : undefined,
        formatted: typeof body?.formatted === "string" ? body.formatted : undefined,
      });
    }

    const session = await createTerritoryCheckoutSession({
      territoryId: reserved.territoryId,
      ownerId: user.id,
      customerEmail: user.email,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Checkout session unavailable" }, { status: 500 });
    }

    return NextResponse.json({
      url: session.url,
      territory_id: reserved.territoryId,
    });
  } catch (error) {
    if (error instanceof TerritoryReserveError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Checkout failed";
    if (
      message === "address required" ||
      message === "Could not resolve county for this address" ||
      message === "No housing data for this area"
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("territory-checkout error", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
