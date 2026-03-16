// Get housing units for a US county from Census ACS. Used for density and benchmark.
const ACS_BASE = "https://api.census.gov/data/2019/acs/acs5";
const CENSUS_KEY = process.env.CENSUS_API_KEY || "";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const state = req.method === "POST" ? (req.body?.state || req.body?.stateFips) : req.query.state;
    const county = req.method === "POST" ? (req.body?.county || req.body?.countyFips) : req.query.county;
    if (!state || !county) {
      return res.status(400).json({ error: "state and county required (FIPS codes)" });
    }
    const stateFips = String(state).padStart(2, "0");
    const countyFips = String(county).padStart(3, "0");
    const params = new URLSearchParams({
      get: "NAME,B25001_001E",
      for: "county:" + countyFips,
      in: "state:" + stateFips,
    });
    if (CENSUS_KEY) params.set("key", CENSUS_KEY);
    const url = `${ACS_BASE}?${params.toString()}`;
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    if (!r.ok) {
      const t = await r.text();
      console.error("Census API error", r.status, t);
      return res.status(502).json({ error: "Census data unavailable" });
    }
    const rows = await r.json();
    const header = rows[0];
    const dataRow = rows[1];
    if (!dataRow) {
      return res.status(200).json({ housing_units: 0, state: stateFips, county: countyFips });
    }
    const idx = header.indexOf("B25001_001E");
    const housingUnits = idx >= 0 ? parseInt(dataRow[idx], 10) || 0 : 0;
    return res.status(200).json({
      housing_units: housingUnits,
      state: stateFips,
      county: countyFips,
    });
  } catch (e) {
    console.error("census-housing error", e);
    return res.status(500).json({ error: "Failed to fetch housing data" });
  }
}
