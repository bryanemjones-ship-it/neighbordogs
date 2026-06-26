import type Stripe from "stripe";
import { createSupabaseServerClient } from "@/shared/lib/supabase";
import type { TerritoryCheckoutMetadata } from "@/features/billing/lib/territory-checkout";
import {
  handleWalkCheckoutCompleted,
  isWalkPaymentSession,
} from "@/features/billing/lib/walk-webhook";

function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status,
): "active" | "canceled" | "past_due" | "unpaid" {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    case "unpaid":
      return "unpaid";
    default:
      return "unpaid";
  }
}

function readCheckoutMetadata(
  metadata: Stripe.Metadata | null | undefined,
): TerritoryCheckoutMetadata | null {
  if (
    metadata?.territory_id &&
    metadata?.owner_id &&
    metadata?.claim_type === "territory_subscription"
  ) {
    return {
      territory_id: metadata.territory_id,
      owner_id: metadata.owner_id,
      claim_type: "territory_subscription",
    };
  }
  return null;
}

export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  if (isWalkPaymentSession(session)) {
    await handleWalkCheckoutCompleted(session);
    return;
  }

  if (session.mode !== "subscription") {
    return;
  }

  const metadata = readCheckoutMetadata(session.metadata);
  if (!metadata) {
    console.error("checkout.session.completed missing metadata", session.metadata);
    return;
  }

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  if (!subscriptionId) {
    console.error("checkout.session.completed missing subscription", session.id);
    return;
  }

  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from("territory_subscriptions")
    .update({
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: customerId || null,
      status: "active",
    })
    .eq("territory_id", metadata.territory_id)
    .eq("owner_id", metadata.owner_id);

  if (error) {
    console.error("failed to activate territory subscription", error);
    throw error;
  }
}

export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
): Promise<void> {
  const supabase = createSupabaseServerClient();
  const status = mapStripeSubscriptionStatus(subscription.status);
  const resolvedStatus =
    subscription.cancel_at_period_end && status === "active" ? "active" : status;

  const updatePayload = {
    status: resolvedStatus,
    stripe_subscription_id: subscription.id,
    stripe_customer_id:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id || null,
  };

  const metadata = readCheckoutMetadata(subscription.metadata);
  const query = metadata?.territory_id
    ? supabase
        .from("territory_subscriptions")
        .update(updatePayload)
        .eq("territory_id", metadata.territory_id)
    : supabase
        .from("territory_subscriptions")
        .update(updatePayload)
        .eq("stripe_subscription_id", subscription.id);

  const { error } = await query;

  if (error) {
    console.error("failed to update territory subscription", error);
    throw error;
  }
}

export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
): Promise<void> {
  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from("territory_subscriptions")
    .update({ status: "canceled" })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error("failed to cancel territory subscription", error);
    throw error;
  }
}
