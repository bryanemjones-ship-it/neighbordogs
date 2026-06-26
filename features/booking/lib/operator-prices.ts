import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_PRICES, type LegacyPrices } from "@/features/booking/lib/models";
import { validateBookingPrice } from "@/features/booking/lib/pricing";
import { withWeeklyComputed } from "@/features/booking/lib/pricing-helpers";

export type WalkPriceQuote = {
  priceCents: number;
  buddyAddonCents: number;
  end: string;
  blockedEnd: string;
};

export function quoteWalkPriceCents(
  prices: LegacyPrices,
  input: {
    walkType: string;
    dogCount: number;
    date: string;
    start: string;
    isEmergency?: boolean;
  },
): WalkPriceQuote {
  const validated = validateBookingPrice(
    {
      date: input.date,
      start: input.start,
      walkType: input.walkType,
      dogCount: input.dogCount,
      isEmergency: input.isEmergency,
    },
    prices,
  );

  if (!validated.valid || validated.price == null) {
    throw new Error(validated.error || "Invalid walk price");
  }

  const buddyAddonCents = Math.round((validated.buddyAddon || 0) * 100);

  return {
    priceCents: Math.round(validated.price * 100),
    buddyAddonCents,
    end: validated.end || input.start,
    blockedEnd: validated.blockedEnd || validated.end || input.start,
  };
}

export type OperatorPriceRow = {
  operator_id: string;
  walk_type: string;
  price_cents: number;
};

export const OPERATOR_PRICE_WALK_TYPES = [
  "w20",
  "w30",
  "w60",
  "emergency",
  "buddyAddon",
  "weeklyDiscount",
] as const;

export type OperatorPriceWalkType = (typeof OPERATOR_PRICE_WALK_TYPES)[number];

export function rowsToLegacyPrices(
  rows: Pick<OperatorPriceRow, "walk_type" | "price_cents">[],
  fallback: LegacyPrices = DEFAULT_PRICES,
): LegacyPrices {
  if (!rows.length) {
    return { ...fallback };
  }

  const loaded: LegacyPrices = { ...fallback };

  for (const row of rows) {
    const val = row.price_cents;
    switch (row.walk_type as OperatorPriceWalkType) {
      case "w20":
        loaded.w20 = val / 100;
        break;
      case "w30":
        loaded.w30 = val / 100;
        break;
      case "w60":
        loaded.w60 = val / 100;
        break;
      case "emergency":
        loaded.emergency = val / 100;
        break;
      case "buddyAddon":
        loaded.buddyAddon = val / 100;
        break;
      case "weeklyDiscount":
        loaded.weeklyDiscount = val;
        break;
    }
  }

  return loaded;
}

export function legacyPricesToRows(
  operatorId: string,
  prices: LegacyPrices,
): OperatorPriceRow[] {
  return [
    {
      operator_id: operatorId,
      walk_type: "w20",
      price_cents: Math.round(prices.w20 * 100),
    },
    {
      operator_id: operatorId,
      walk_type: "w30",
      price_cents: Math.round(prices.w30 * 100),
    },
    {
      operator_id: operatorId,
      walk_type: "w60",
      price_cents: Math.round(prices.w60 * 100),
    },
    {
      operator_id: operatorId,
      walk_type: "emergency",
      price_cents: Math.round(prices.emergency * 100),
    },
    {
      operator_id: operatorId,
      walk_type: "buddyAddon",
      price_cents: Math.round(prices.buddyAddon * 100),
    },
    {
      operator_id: operatorId,
      walk_type: "weeklyDiscount",
      price_cents: prices.weeklyDiscount,
    },
  ];
}

export async function fetchOperatorPrices(
  supabase: SupabaseClient,
  operatorId: string,
): Promise<LegacyPrices> {
  const { data, error } = await supabase
    .from("operator_prices")
    .select("walk_type, price_cents")
    .eq("operator_id", operatorId);

  if (error) {
    console.error("fetchOperatorPrices error", error);
    return { ...DEFAULT_PRICES };
  }

  return withWeeklyComputed(rowsToLegacyPrices(data || []));
}

export async function upsertOperatorPrices(
  supabase: SupabaseClient,
  operatorId: string,
  prices: LegacyPrices,
): Promise<{ error: Error | null }> {
  const computed = withWeeklyComputed(prices);
  const rows = legacyPricesToRows(operatorId, computed);

  const { error } = await supabase
    .from("operator_prices")
    .upsert(rows, { onConflict: "operator_id,walk_type" });

  return { error: error ? new Error(error.message) : null };
}
