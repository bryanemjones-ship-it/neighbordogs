import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  const trimmed = key.trim();
  const normalized = /\s/.test(trimmed) ? trimmed.replace(/\s/g, "") : trimmed;
  if (!normalized) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return normalized;
}

export function getStripeTerritoryPriceId(): string {
  const priceId = process.env.STRIPE_TERRITORY_PRICE_ID;
  if (!priceId) {
    throw new Error("STRIPE_TERRITORY_PRICE_ID is not configured");
  }
  return priceId;
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }
  return secret;
}

export function getStripeConnectWebhookSecret(): string | null {
  const secret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;
  if (!secret) {
    return null;
  }
  return secret;
}

export function getAppOrigin(): string {
  const origin = process.env.NEXT_PUBLIC_APP_URL;
  if (!origin) {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured");
  }
  return origin.replace(/\/$/, "");
}

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeSecretKey());
  }
  return stripeClient;
}
