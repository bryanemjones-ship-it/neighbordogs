function testModeEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_TEST_MODE === "true" && process.env.NODE_ENV !== "production";
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  return res.status(200).json({ enabled: testModeEnabled() });
}
