import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as turf from "@turf/turf";
import type { Feature, Polygon } from "geojson";

const MILES_TO_KM = 1.609344;
const MAX_OVERLAP_RATIO = 0.05;
export const BASE_PRICE_CENTS = 14900;
const STANDARD_MONTHLY_PRICE = 149;

export type GeocodeResult = {
  lat: number;
  lng: number;
  state: string;
  county: string;
  formatted: string;
};

export type OwnedTerritory = {
  center_lat: number;
  center_lng: number;
  radius_miles: number;
};

export type TerritoryPreviewResult = {
  ok: true;
  center_lat: number;
  center_lng: number;
  radius_miles: number;
  estimated_homes: number;
  estimated_dog_households: number;
  overlap_status: "available" | "adjusted" | "limited_overlap";
  max_overlap_ratio: number;
  is_smaller_fallback: boolean;
  opportunity_pct: number;
  monthly_cents: number;
  monthly_price: number;
  standard_monthly_price: number;
  anchor_address: string;
};

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const CENSUS_GEOCODE =
    "https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress";
  const q = new URLSearchParams({
    address,
    benchmark: "Public_AR_Current",
    vintage: "Current_Current",
    format: "json",
  });

  const geocoderUrl = `${CENSUS_GEOCODE}?${q.toString()}`;
  console.log("[territory-preview] Census Geocoder URL:", geocoderUrl);

  const r = await fetch(geocoderUrl);
  const data = await r.json();
  console.log(
    "[territory-preview] Census Geocoder raw response:",
    JSON.stringify(data, null, 2),
  );
  const matches = data.result?.addressMatches || [];
  if (!matches.length) return null;

  const m = matches[0];
  const geos = m.geographies || {};

  let state: string | null = null;
  let county: string | null = null;

  for (const value of Object.values(geos)) {
    if (!Array.isArray(value) || !value.length) continue;

    for (const row of value) {
      if (!state && row?.STATE) state = row.STATE;
      if (!county && row?.COUNTY) county = row.COUNTY;
      if (state && county) break;
    }

    if (state && county) break;
  }

  if (!state || !county) return null;

  return {
    lat: m.coordinates.y,
    lng: m.coordinates.x,
    state,
    county,
    formatted: m.matchedAddress || address,
  };
}

export async function countyHousing(
  stateFips: string,
  countyFips: string,
): Promise<number> {
  const ACS_BASE = "https://api.census.gov/data/2019/acs/acs5";
  const params = new URLSearchParams({
    get: "NAME,B25001_001E",
    for: `county:${String(countyFips).padStart(3, "0")}`,
    in: `state:${String(stateFips).padStart(2, "0")}`,
  });
  if (process.env.CENSUS_API_KEY) params.set("key", process.env.CENSUS_API_KEY);

  const acsUrl = `${ACS_BASE}?${params.toString()}`;
  console.log("[territory-preview] Census ACS URL:", acsUrl);

  const r = await fetch(acsUrl);
  const raw = await r.text();
  console.log(
    "[territory-preview] Census ACS raw response:",
    raw,
  );

  if (!r.ok || !raw) return 0;

  let rows: unknown;
  try {
    rows = JSON.parse(raw);
  } catch {
    return 0;
  }

  if (!Array.isArray(rows) || rows.length < 2) return 0;

  const header = rows[0];
  const dataRow = rows[1];

  if (!Array.isArray(header) || !Array.isArray(dataRow)) return 0;

  const idx = header.indexOf("B25001_001E");
  return idx >= 0 ? parseInt(String(dataRow[idx]), 10) || 0 : 0;
}

function approximateCountyAreaSqMi(stateFips: string, countyFips: string): number {
  const known: Record<string, number> = { "37063": 857 };
  return known[stateFips + countyFips] || 400;
}

export function circleToPolygon(
  lat: number,
  lng: number,
  radiusMiles: number,
  steps = 64,
): Feature<Polygon> {
  const radiusKm = radiusMiles * MILES_TO_KM;
  const center = turf.point([lng, lat]);
  return turf.circle(center, radiusKm, { units: "kilometers", steps });
}

export function intersectionAreaRatio(
  poly1: Feature<Polygon>,
  poly2: Feature<Polygon>,
): number {
  try {
    const inter = turf.intersect(turf.featureCollection([poly1, poly2]));
    if (!inter) return 0;
    const area1 = turf.area(poly1);
    return area1 > 0 ? turf.area(inter) / area1 : 0;
  } catch {
    return 0;
  }
}

function maxOverlapWithOwned(
  lat: number,
  lng: number,
  radiusMiles: number,
  owned: OwnedTerritory[],
): number {
  const poly = circleToPolygon(lat, lng, radiusMiles);
  let maxOverlap = 0;
  for (const t of owned) {
    const opoly = circleToPolygon(t.center_lat, t.center_lng, t.radius_miles);
    const ratio = intersectionAreaRatio(poly, opoly);
    if (ratio > maxOverlap) maxOverlap = ratio;
  }
  return maxOverlap;
}

/** Rough share of households with dogs (~38% US average). */
export function estimateDogHouseholds(housingUnits: number): number {
  return Math.round(housingUnits * 0.38);
}

function createSupabaseServerClient(): SupabaseClient {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase is not configured");
  }

  return createClient(supabaseUrl, supabaseKey);
}

async function loadBenchmarkBaseOpportunity(
  supabase: SupabaseClient,
): Promise<number> {
  let baseOpportunity = 5000;

  try {
    const { data: configRow, error } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", "benchmark")
      .maybeSingle();

    if (!error && configRow?.value?.base_opportunity) {
      baseOpportunity = configRow.value.base_opportunity;
    }
  } catch {
    // fallback to default benchmark
  }

  return baseOpportunity;
}

const OVERLAP_BLOCKING_STATUSES = ["active", "unpaid", "past_due"] as const;

async function loadActiveTerritories(
  supabase: SupabaseClient,
): Promise<OwnedTerritory[]> {
  try {
    const { data: subs, error } = await supabase
      .from("territory_subscriptions")
      .select("territory_id, territories(center_lat, center_lng, radius_miles)")
      .in("status", [...OVERLAP_BLOCKING_STATUSES]);

    if (error || !subs) return [];

    return subs.flatMap((s) => {
      const territory = s.territories as
        | OwnedTerritory
        | OwnedTerritory[]
        | null;
      if (!territory) return [];
      return Array.isArray(territory) ? territory : [territory];
    });
  } catch {
    return [];
  }
}

export type TerritoryPreviewInput = {
  address?: string;
  lat?: number;
  lng?: number;
  state?: string;
  county?: string;
  formatted?: string;
};

export async function previewTerritory(
  input: TerritoryPreviewInput,
): Promise<TerritoryPreviewResult> {
  let geo: GeocodeResult | null = null;

  if (
    typeof input.lat === "number" &&
    typeof input.lng === "number" &&
    input.state &&
    input.county
  ) {
    geo = {
      lat: input.lat,
      lng: input.lng,
      state: input.state,
      county: input.county,
      formatted: input.formatted || input.address || "",
    };
  } else {
    const address = (input.address || "").trim();
    if (!address) {
      throw new Error("address required");
    }
    geo = await geocodeAddress(address);
  }

  if (!geo?.state || !geo?.county) {
    throw new Error("Could not resolve county for this address");
  }

  const supabase = createSupabaseServerClient();
  const baseOpportunity = await loadBenchmarkBaseOpportunity(supabase);
  const housing = await countyHousing(geo.state, geo.county);
  const countyAreaSqMi = approximateCountyAreaSqMi(geo.state, geo.county);
  const density = countyAreaSqMi > 0 ? housing / countyAreaSqMi : 0;

  console.log("[territory-preview] Housing density inputs:", {
    stateFips: geo.state,
    countyFips: geo.county,
    housing,
    countyAreaSqMi,
    density,
  });

  if (density <= 0) {
    throw new Error("No housing data for this area");
  }

  const targetAreaSqMi = baseOpportunity / density;
  const radiusMiles = Math.sqrt(targetAreaSqMi / Math.PI);
  const owned = await loadActiveTerritories(supabase);

  const maxOverlap = maxOverlapWithOwned(geo.lat, geo.lng, radiusMiles, owned);

  const shiftSteps = [0.02, 0.05, 0.1, 0.15];
  const directions = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
    [0.7, 0.7],
    [-0.7, 0.7],
    [0.7, -0.7],
    [-0.7, -0.7],
  ];
  let bestLat = geo.lat;
  let bestLng = geo.lng;
  let bestOverlap = maxOverlap;
  let centerAdjusted = false;

  if (maxOverlap > MAX_OVERLAP_RATIO) {
    for (const step of shiftSteps) {
      for (const [dx, dy] of directions) {
        const clat = geo.lat + (dy * step) / 69;
        const clng =
          geo.lng + (dx * step) / (69 * Math.cos((geo.lat * Math.PI) / 180));
        const overlap = maxOverlapWithOwned(clat, clng, radiusMiles, owned);

        if (overlap <= MAX_OVERLAP_RATIO) {
          bestLat = clat;
          bestLng = clng;
          bestOverlap = overlap;
          centerAdjusted = true;
          break;
        }
        if (overlap < bestOverlap) {
          bestOverlap = overlap;
          bestLat = clat;
          bestLng = clng;
          centerAdjusted = true;
        }
      }
      if (bestOverlap <= MAX_OVERLAP_RATIO) break;
    }
  }

  const isSmallerFallback = bestOverlap > MAX_OVERLAP_RATIO;
  let finalLat = bestLat;
  let finalLng = bestLng;
  let finalRadius = radiusMiles;
  let estimatedHomes = Math.round(density * Math.PI * radiusMiles * radiusMiles);

  if (isSmallerFallback) {
    for (let r = radiusMiles * 0.95; r >= 0.1; r -= 0.05) {
      const overlap = maxOverlapWithOwned(bestLat, bestLng, r, owned);
      if (overlap <= MAX_OVERLAP_RATIO) {
        finalRadius = r;
        finalLat = bestLat;
        finalLng = bestLng;
        estimatedHomes = Math.round(density * Math.PI * r * r);
        break;
      }
    }
  } else {
    estimatedHomes = Math.round(density * Math.PI * finalRadius * finalRadius);
  }

  const opportunityPct =
    baseOpportunity > 0 ? (estimatedHomes / baseOpportunity) * 100 : 0;
  const opportunityRatio =
    baseOpportunity > 0 ? estimatedHomes / baseOpportunity : 0;
  const monthlyCents = isSmallerFallback
    ? Math.round(BASE_PRICE_CENTS * opportunityRatio)
    : BASE_PRICE_CENTS;

  let overlapStatus: TerritoryPreviewResult["overlap_status"] = "available";
  if (isSmallerFallback) {
    overlapStatus = "limited_overlap";
  } else if (centerAdjusted || maxOverlap > 0) {
    overlapStatus = "adjusted";
  }

  return {
    ok: true,
    center_lat: finalLat,
    center_lng: finalLng,
    radius_miles: Math.round(finalRadius * 1000) / 1000,
    estimated_homes: estimatedHomes,
    estimated_dog_households: estimateDogHouseholds(estimatedHomes),
    overlap_status: overlapStatus,
    max_overlap_ratio: Math.round(bestOverlap * 1000) / 1000,
    is_smaller_fallback: isSmallerFallback,
    opportunity_pct: Math.round(opportunityPct * 10) / 10,
    monthly_cents: monthlyCents,
    monthly_price: monthlyCents / 100,
    standard_monthly_price: STANDARD_MONTHLY_PRICE,
    anchor_address: geo.formatted || input.address || "",
  };
}
