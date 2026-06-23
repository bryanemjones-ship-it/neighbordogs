import type Stripe from "stripe";
import { getAppOrigin, getStripeClient, getStripeTerritoryPriceId } from "@/features/billing/lib/stripe";

export type TerritoryCheckoutMetadata = {
  territory_id: string;
  owner_id: string;
  claim_type: "territory_subscription";
};

export type CreateTerritoryCheckoutInput = {
  territoryId: string;
  ownerId: string;
  customerEmail?: string | null;
};

export async function createTerritoryCheckoutSession(
  input: CreateTerritoryCheckoutInput,
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeClient();
  const origin = getAppOrigin();
  const priceId = getStripeTerritoryPriceId();

  const metadata: TerritoryCheckoutMetadata = {
    territory_id: input.territoryId,
    owner_id: input.ownerId,
    claim_type: "territory_subscription",
  };

  return stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/territory-preview/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/territory-preview?checkout=cancelled`,
    customer_email: input.customerEmail || undefined,
    metadata,
    subscription_data: {
      metadata,
    },
  });
}
