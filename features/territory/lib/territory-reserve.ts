import { createSupabaseServerClient } from "@/shared/lib/supabase";
import {
  BASE_PRICE_CENTS,
  previewTerritory,
  type TerritoryPreviewInput,
} from "@/features/territory/lib/territory-preview";

export type ReserveTerritoryResult = {
  territoryId: string;
  monthlyCents: number;
};

export class TerritoryReserveError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "TerritoryReserveError";
    this.status = status;
  }
}

export async function reserveTerritoryForCheckout(
  ownerId: string,
  input: TerritoryPreviewInput,
): Promise<ReserveTerritoryResult> {
  const preview = await previewTerritory(input);

  if (preview.monthly_cents !== BASE_PRICE_CENTS) {
    throw new TerritoryReserveError(
      "This adjusted territory requires a custom quote. Contact NeighborDogs to claim it.",
      409,
    );
  }

  const supabase = createSupabaseServerClient();

  const { data: territory, error: territoryError } = await supabase
    .from("territories")
    .insert({
      center_lat: preview.center_lat,
      center_lng: preview.center_lng,
      radius_miles: preview.radius_miles,
      estimated_homes: preview.estimated_homes,
      opportunity_pct: preview.opportunity_pct,
      anchor_address: preview.anchor_address,
      is_smaller_fallback: preview.is_smaller_fallback,
    })
    .select("id")
    .single();

  if (territoryError || !territory) {
    console.error("territory reserve insert failed", territoryError);
    throw new TerritoryReserveError("Could not reserve territory", 500);
  }

  const { error: subscriptionError } = await supabase
    .from("territory_subscriptions")
    .insert({
      territory_id: territory.id,
      owner_id: ownerId,
      status: "unpaid",
      monthly_cents: preview.monthly_cents,
    });

  if (subscriptionError) {
    await supabase.from("territories").delete().eq("id", territory.id);
    console.error("territory subscription insert failed", subscriptionError);
    throw new TerritoryReserveError("Could not reserve territory subscription", 500);
  }

  return {
    territoryId: territory.id,
    monthlyCents: preview.monthly_cents,
  };
}

export async function reserveExistingTerritoryForCheckout(
  ownerId: string,
  territoryId: string,
): Promise<ReserveTerritoryResult> {
  const supabase = createSupabaseServerClient();

  const { data: subscription, error } = await supabase
    .from("territory_subscriptions")
    .select("territory_id, owner_id, status, monthly_cents, stripe_subscription_id")
    .eq("territory_id", territoryId)
    .maybeSingle();

  if (error || !subscription) {
    throw new TerritoryReserveError("Territory not found", 404);
  }

  if (subscription.owner_id !== ownerId) {
    throw new TerritoryReserveError("Territory is not claimable by this account", 403);
  }

  if (subscription.stripe_subscription_id) {
    throw new TerritoryReserveError("Territory subscription already exists", 409);
  }

  if (subscription.status !== "unpaid") {
    throw new TerritoryReserveError("Territory is not available for checkout", 409);
  }

  return {
    territoryId: subscription.territory_id,
    monthlyCents: subscription.monthly_cents,
  };
}
