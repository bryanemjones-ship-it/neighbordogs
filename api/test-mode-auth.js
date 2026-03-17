function testModeEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_TEST_MODE === "true" && process.env.NODE_ENV !== "production";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!testModeEnabled()) return res.status(404).json({ error: "Not found" });
  const pin = (req.body && req.body.pin) || "";
  const expected = process.env.TEST_MODE_PIN || "";
  if (!expected || pin !== expected) return res.status(401).json({ error: "Unauthorized" });
  return res.status(200).json({ ok: true });
}
