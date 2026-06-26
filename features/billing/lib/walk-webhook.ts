import type Stripe from "stripe";
import { createSupabaseServerClient } from "@/shared/lib/supabase";
import type { WalkCheckoutMetadata } from "@/features/billing/lib/walk-checkout";

function readWalkCheckoutMetadata(
  metadata: Stripe.Metadata | null | undefined,
): WalkCheckoutMetadata | null {
  if (
    metadata?.booking_id &&
    metadata?.operator_id &&
    metadata?.claim_type === "walk_payment"
  ) {
    return {
      booking_id: metadata.booking_id,
      operator_id: metadata.operator_id,
      operator_slug: metadata.operator_slug || "",
      walk_type: metadata.walk_type || "",
      price_cents: metadata.price_cents || "0",
      platform_fee_cents: metadata.platform_fee_cents || "0",
      claim_type: "walk_payment",
    };
  }
  return null;
}

export async function handleWalkCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const metadata = readWalkCheckoutMetadata(session.metadata);
  if (!metadata) {
    return;
  }

  if (session.payment_status !== "paid") {
    console.error(
      "[walk-webhook] checkout session payment_status is not paid",
      session.id,
      session.payment_status,
    );
    throw new Error("Walk checkout session is not paid");
  }

  if (session.amount_total != null) {
    const expectedCents = parseInt(metadata.price_cents, 10);
    if (!Number.isFinite(expectedCents) || session.amount_total !== expectedCents) {
      console.error(
        "[walk-webhook] amount_total does not match metadata.price_cents",
        session.id,
        { amount_total: session.amount_total, price_cents: metadata.price_cents },
      );
      throw new Error("Walk checkout session amount does not match expected price");
    }
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from("bookings")
    .update({
      payment_status: "paid",
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId || null,
      status: "pending",
    })
    .eq("id", metadata.booking_id)
    .eq("operator_id", metadata.operator_id);

  if (error) {
    console.error("[walk-webhook] failed to mark booking paid", error);
    throw error;
  }
}

export function isWalkPaymentSession(
  session: Stripe.Checkout.Session,
): boolean {
  return session.metadata?.claim_type === "walk_payment";
}
