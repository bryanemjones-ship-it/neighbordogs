import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const config = { api: { bodyParser: false } };

function buffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }
  const raw = await buffer(req);
  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, req.headers["stripe-signature"], endpointSecret);
  } catch (e) {
    console.error("webhook signature error", e.message);
    return res.status(400).send("Webhook signature verification failed");
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const territoryId = session.metadata?.territory_id;
      const ownerId = session.metadata?.owner_id;
      const subId = session.subscription;
      const customerId = session.customer;
      if (!territoryId || !ownerId || !subId) {
        console.error("webhook missing metadata", session.metadata);
        return res.status(200).send("ok");
      }
      const sub = await stripe.subscriptions.retrieve(subId);
      const status = sub.status === "active" ? "active" : sub.status;
      await supabase.from("territory_subscriptions").insert({
        territory_id: territoryId,
        owner_id: ownerId,
        stripe_subscription_id: subId,
        stripe_customer_id: customerId,
        status,
        monthly_cents: sub.items?.data?.[0]?.price?.unit_amount || 14900,
      });
    } else if (event.type === "customer.subscription.updated") {
      const sub = event.data.object;
      const status = sub.status === "active" ? "active" : sub.cancel_at_period_end ? "active" : sub.status;
      await supabase
        .from("territory_subscriptions")
        .update({ status: status === "canceled" ? "canceled" : status })
        .eq("stripe_subscription_id", sub.id);
    } else if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object;
      await supabase.from("territory_subscriptions").delete().eq("stripe_subscription_id", sub.id);
    }
  } catch (e) {
    console.error("webhook handler error", e);
    return res.status(500).send("Webhook handler error");
  }
  res.status(200).send("ok");
}
