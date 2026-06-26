import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return key;
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

export function getAppOrigin(): string {
  const origin = process.env.NEXT_PUBLIC_APP_URL;
  if (!origin) {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured");
  }
  return origin.replace(/\/$/, "");
}

export function getWalkPlatformFeePercent(): number {
  const raw = process.env.STRIPE_WALK_PLATFORM_FEE_PERCENT;
  const parsed = raw ? parseInt(raw, 10) : 10;
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    return 10;
  }
  return parsed;
}

export function calculateWalkPlatformFeeCents(totalCents: number): number {
  const percent = getWalkPlatformFeePercent();
  return Math.max(0, Math.round((totalCents * percent) / 100));
}

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeSecretKey());
  }
  return stripeClient;
}
