// Compute BASE_OPPORTUNITY from benchmark address and radius. Store in app_config.
const BENCHMARK_ADDRESS = "5324 Inglewood Lane, Raleigh, NC 27609";
const BENCHMARK_RADIUS_MILES = 1.5;

async function geocode(address) {
  const CENSUS_GEOCODE = "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress";
  const q = new URLSearchParams({ address, benchmark: "Public_AR_Current", format: "json" });
  const r = await fetch(`${CENSUS_GEOCODE}?${q.toString()}`);
  const data = await r.json();
  const matches = data.result?.addressMatches || [];
  if (!matches.length) return null;
  const m = matches[0];
  const state = m.geographies?.["Census Tracts"]?.[0]?.STATE || m.geographies?.["States"]?.[0]?.STATE;
  const county = m.geographies?.["Census Tracts"]?.[0]?.COUNTY || m.geographies?.["Counties"]?.[0]?.COUNTY;
  return { lat: m.coordinates.y, lng: m.coordinates.x, state, county };
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
  const rows = await r.json();
  const header = rows[0];
  const dataRow = rows[1];
  if (!dataRow) return 0;
  const idx = header.indexOf("B25001_001E");
  return idx >= 0 ? parseInt(dataRow[idx], 10) || 0 : 0;
}

// Approximate county area in sq mi (Wake County NC ~ 857). Use constant per state/county or approximate.
function approximateCountyAreaSqMi(stateFips, countyFips) {
  const known = { "37063": 857 };
  const key = stateFips + countyFips;
  return known[key] || 400;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const address = (req.body?.address || BENCHMARK_ADDRESS).trim();
  const radiusMiles = Number(req.body?.radius_miles) || BENCHMARK_RADIUS_MILES;

  try {
    const geo = await geocode(address);
    if (!geo) {
      return res.status(400).json({ error: "Benchmark address could not be geocoded" });
    }
    const housing = await countyHousing(geo.state, geo.county);
    const countyAreaSqMi = approximateCountyAreaSqMi(geo.state, geo.county);
    const density = countyAreaSqMi > 0 ? housing / countyAreaSqMi : 0;
    const circleAreaSqMi = Math.PI * radiusMiles * radiusMiles;
    const baseOpportunity = Math.round(density * circleAreaSqMi);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from("app_config").upsert(
        {
          key: "benchmark",
          value: {
            address,
            radius_miles: radiusMiles,
            base_opportunity: baseOpportunity,
            center_lat: geo.lat,
            center_lng: geo.lng,
            state: geo.state,
            county: geo.county,
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );
    }

    return res.status(200).json({
      ok: true,
      base_opportunity: baseOpportunity,
      address,
      radius_miles: radiusMiles,
      center_lat: geo.lat,
      center_lng: geo.lng,
      county_housing: housing,
      county_area_sqmi: countyAreaSqMi,
    });
  } catch (e) {
    console.error("benchmark error", e);
    return res.status(500).json({ error: "Benchmark calculation failed" });
  }
}
