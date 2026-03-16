import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
const BASE_PRICE_CENTS = 14900;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.slice(7);
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const body = req.body || {};
  const {
    center_lat,
    center_lng,
    radius_miles,
    estimated_homes,
    opportunity_pct,
    anchor_address,
    is_smaller_fallback,
    monthly_cents,
  } = body;

  if (
    typeof center_lat !== "number" ||
    typeof center_lng !== "number" ||
    typeof radius_miles !== "number" ||
    !estimated_homes ||
    !anchor_address
  ) {
    return res.status(400).json({ error: "Missing or invalid preview data" });
  }

  const cents = typeof monthly_cents === "number" && monthly_cents > 0 ? monthly_cents : BASE_PRICE_CENTS;
  const origin = req.headers.origin || req.headers.referer || "https://neighbordogs.com";

  try {
    const supabaseService = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey);
    const { data: territory, error: terrError } = await supabaseService
      .from("territories")
      .insert({
        center_lat,
        center_lng,
        radius_miles,
        estimated_homes,
        opportunity_pct: opportunity_pct ?? (estimated_homes / 5000) * 100,
        anchor_address,
        is_smaller_fallback: !!is_smaller_fallback,
      })
      .select("id")
      .single();

    if (terrError || !territory) {
      console.error("territory insert error", terrError);
      return res.status(500).json({ error: "Failed to create territory" });
    }

    const price = await stripe.prices.create({
      unit_amount: cents,
      currency: "usd",
      recurring: { interval: "month" },
      product_data: { name: "NeighborDogs Territory" },
    });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: price.id, quantity: 1 }],
      success_url: `${origin}/?territory=success&id=${territory.id}`,
      cancel_url: `${origin}/?territory=cancel`,
      subscription_data: {
        metadata: { territory_id: territory.id, owner_id: user.id },
      },
      metadata: { territory_id: territory.id, owner_id: user.id },
      customer_email: user.email,
    });

    return res.status(200).json({ url: session.url, session_id: session.id, territory_id: territory.id });
  } catch (e) {
    console.error("create-checkout error", e);
    return res.status(500).json({ error: "Checkout failed" });
  }
}
