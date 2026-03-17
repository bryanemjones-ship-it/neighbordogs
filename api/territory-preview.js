import { createClient } from "@supabase/supabase-js";
import * as turf from "@turf/turf";

const MILES_TO_KM = 1.609344;
const MAX_OVERLAP_RATIO = 0.05;
const BASE_PRICE_CENTS = 14900;
const BENCHMARK_ADDRESS = "5324 Inglewood Lane, Raleigh, NC 27609";
const BENCHMARK_RADIUS_MILES = 1.5;

async function geocode(address) {
  const CENSUS_GEOCODE = "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress";
  const q = new URLSearchParams({
    address,
    benchmark: "Public_AR_Current",
    vintage: "Current_Current",
    format: "json"
  });
  const r = await fetch(`${CENSUS_GEOCODE}?${q.toString()}`);
  const data = await r.json();
  console.log("GEOCODE_RAW_RESPONSE", JSON.stringify(data, null, 2));
  const matches = data.result?.addressMatches || [];
  if (!matches.length) return null;
  const m = matches[0];
  console.log("GEOCODE_MATCH", JSON.stringify(m, null, 2));
  const geos = m.geographies || {};

  let state = null;
  let county = null;

  for (const [key, value] of Object.entries(geos)) {
    if (!Array.isArray(value) || !value.length) continue;

    for (const row of value) {
      if (!state && row?.STATE) state = row.STATE;
      if (!county && row?.COUNTY) county = row.COUNTY;

      if (state && county) break;
    }

    if (state && county) break;
  }

  return { lat: m.coordinates.y, lng: m.coordinates.x, state, county, formatted: m.matchedAddress || address };
}

async function countyHousing(stateFips, countyFips) {
  const ACS_BASE = "https://api.census.gov/data/2019/acs/acs5";
  const params = new URLSearchParams({
    get: "NAME,B25001_001E",
    for: "county:" + String(countyFips).padStart(3, "0"),
    in: "state:" + String(stateFips).padStart(2, "0"),
  });
  if (process.env.CENSUS_API_KEY) params.set("key", process.env.CENSUS_API_KEY);
  const r = await fetch(`${ACS_BASE}?${params.toString()}`);
  const raw = await r.text();

  if (!r.ok || !raw) {
    return 0;
  }

  let rows;
  try {
    rows = JSON.parse(raw);
  } catch (e) {
    return 0;
  }

  if (!Array.isArray(rows) || rows.length < 2) {
    return 0;
  }

  const header = rows[0];
  const dataRow = rows[1];

  if (!Array.isArray(header) || !Array.isArray(dataRow)) {
    return 0;
  }

  const idx = header.indexOf("B25001_001E");
  return idx >= 0 ? parseInt(dataRow[idx], 10) || 0 : 0;
}

function approximateCountyAreaSqMi(stateFips, countyFips) {
  const known = { "37063": 857 };
  return known[stateFips + countyFips] || 400;
}

function circleToPolygon(lat, lng, radiusMiles, steps = 64) {
  const radiusKm = radiusMiles * MILES_TO_KM;
  const center = turf.point([lng, lat]);
  const circle = turf.circle(center, radiusKm, { units: "kilometers", steps });
  return circle;
}

function intersectionAreaRatio(poly1, poly2) {
  try {
    const inter = turf.intersect(turf.featureCollection([poly1, poly2]));
    if (!inter) return 0;
    const area1 = turf.area(poly1);
    return area1 > 0 ? turf.area(inter) / area1 : 0;
  } catch (e) {
    return 0;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const address = (req.body?.address || "").trim();
  if (!address) return res.status(400).json({ error: "address required" });

  try {
    const geo = await geocode(address);
    if (!geo?.state || !geo?.county) {
      return res.status(400).json({ error: "Could not resolve county for this address" });
    }
    if (!geo) return res.status(400).json({ error: "Address not found" });

    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
      throw new Error("Missing SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL");
    }

    if (!supabaseKey) {
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let benchmark = { base_opportunity: 5000 };

    try {
      const { data: configRow, error } = await supabase
        .from("app_config")
        .select("value")
        .eq("key", "benchmark")
        .maybeSingle();

      if (!error && configRow?.value?.base_opportunity) {
        benchmark.base_opportunity = configRow.value.base_opportunity;
      }
    } catch (e) {
      // fallback to default benchmark
    }

    const baseOpportunity = benchmark.base_opportunity;
    const housing = await countyHousing(geo.state, geo.county);
    const countyAreaSqMi = approximateCountyAreaSqMi(geo.state, geo.county);
    const density = countyAreaSqMi > 0 ? housing / countyAreaSqMi : 0;
    if (density <= 0) return res.status(400).json({ error: "No housing data for this area" });

    const targetAreaSqMi = baseOpportunity / density;
    const radiusMiles = Math.sqrt(targetAreaSqMi / Math.PI);

    let owned = [];

    try {
      const { data: subs, error } = await supabase
        .from("territory_subscriptions")
        .select("territory_id, territories(center_lat, center_lng, radius_miles)")
        .eq("status", "active");

      if (!error && subs) {
        owned = subs.map((s) => s.territories).filter(Boolean);
      }
    } catch (e) {
      owned = [];
    }

    const newPoly = circleToPolygon(geo.lat, geo.lng, radiusMiles);
    let maxOverlap = 0;
    for (const t of owned) {
      const poly = circleToPolygon(t.center_lat, t.center_lng, t.radius_miles);
      const ratio = intersectionAreaRatio(newPoly, poly);
      if (ratio > maxOverlap) maxOverlap = ratio;
    }

    const shiftSteps = [0.02, 0.05, 0.1, 0.15];
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]];
    let bestLat = geo.lat;
    let bestLng = geo.lng;
    let bestOverlap = maxOverlap;

    if (maxOverlap > MAX_OVERLAP_RATIO) {
      for (const step of shiftSteps) {
        for (const [dx, dy] of directions) {
          const clat = geo.lat + (dy * step) / 69;
          const clng = geo.lng + (dx * step) / (69 * Math.cos((geo.lat * Math.PI) / 180));
          const poly = circleToPolygon(clat, clng, radiusMiles);
          let overlap = 0;
          for (const t of owned) {
            const opoly = circleToPolygon(t.center_lat, t.center_lng, t.radius_miles);
            const r = intersectionAreaRatio(poly, opoly);
            if (r > overlap) overlap = r;
          }
          if (overlap <= MAX_OVERLAP_RATIO) {
            bestLat = clat;
            bestLng = clng;
            bestOverlap = overlap;
            break;
          }
          if (overlap < bestOverlap) {
            bestOverlap = overlap;
            bestLat = clat;
            bestLng = clng;
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
        const poly = circleToPolygon(bestLat, bestLng, r);
        let overlap = 0;
        for (const t of owned) {
          const opoly = circleToPolygon(t.center_lat, t.center_lng, t.radius_miles);
          const ratio = intersectionAreaRatio(poly, opoly);
          if (ratio > overlap) overlap = ratio;
        }
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

    const opportunityPct = baseOpportunity > 0 ? (estimatedHomes / baseOpportunity) * 100 : 0;
    const opportunityRatio = baseOpportunity > 0 ? estimatedHomes / baseOpportunity : 0;
    const monthlyCents = isSmallerFallback ? Math.round(BASE_PRICE_CENTS * opportunityRatio) : BASE_PRICE_CENTS;

    return res.status(200).json({
      ok: true,
      center_lat: finalLat,
      center_lng: finalLng,
      radius_miles: Math.round(finalRadius * 1000) / 1000,
      estimated_homes: estimatedHomes,
      opportunity_pct: Math.round(opportunityPct * 10) / 10,
      monthly_cents: monthlyCents,
      monthly_price: (monthlyCents / 100).toFixed(2),
      is_smaller_fallback: isSmallerFallback,
      anchor_address: geo.formatted || address,
    });
  } catch (e) {
    console.error("territory-preview error", e);
    return res.status(500).json({ error: "Territory preview failed" });
  }
}
