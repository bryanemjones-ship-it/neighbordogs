// Geocode US address to lat/lng. Uses Census Geocoder (free, no key required).
const CENSUS_GEOCODE = "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { address } = req.body || {};
    if (!address || typeof address !== "string") {
      return res.status(400).json({ error: "address required" });
    }
    const q = new URLSearchParams({
      address: address.trim(),
      benchmark: "Public_AR_Current",
      format: "json",
    });
    const r = await fetch(`${CENSUS_GEOCODE}?${q.toString()}`, { headers: { Accept: "application/json" } });
    const data = await r.json();
    const matches = data.result?.addressMatches || [];
    if (!matches.length) {
      return res.status(200).json({ ok: false, error: "Address not found" });
    }
    const m = matches[0];
    const coords = m.coordinates;
    const state = m.geographies?.["Census Tracts"]?.[0]?.STATE || m.geographies?.["States"]?.[0]?.STATE;
    const county = m.geographies?.["Census Tracts"]?.[0]?.COUNTY || m.geographies?.["Counties"]?.[0]?.COUNTY;
    const tract = m.geographies?.["Census Tracts"]?.[0]?.TRACT;
    return res.status(200).json({
      ok: true,
      lat: coords.y,
      lng: coords.x,
      formatted: m.matchedAddress || address,
      state,
      county,
      tract,
    });
  } catch (e) {
    console.error("geocode error", e);
    return res.status(500).json({ error: "Geocoding failed" });
  }
}
