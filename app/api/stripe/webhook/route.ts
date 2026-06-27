import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getStripeClient,
  getStripeConnectWebhookSecret,
  getStripeWebhookSecret,
} from "@/features/billing/lib/stripe";
import {
  handleCheckoutSessionCompleted,
  handleSubscriptionDeleted,
  handleSubscriptionUpdated,
} from "@/features/billing/lib/territory-webhook";
import { isWalkPaymentSession } from "@/features/billing/lib/walk-webhook";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      getStripeWebhookSecret(),
    );
  } catch (platformError) {
    const connectSecret = getStripeConnectWebhookSecret();
    if (
      !(platformError instanceof Stripe.errors.StripeSignatureVerificationError) ||
      !connectSecret
    ) {
      const message =
        platformError instanceof Error
          ? platformError.message
          : "Webhook signature verification failed";
      console.error("stripe webhook signature error", message);
      return NextResponse.json({ error: message }, { status: 400 });
    }

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, connectSecret);
    } catch (connectError) {
      const message =
        connectError instanceof Error
          ? connectError.message
          : "Webhook signature verification failed";
      console.error("stripe webhook signature error", message);
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const connectAccountId =
          typeof event.account === "string" ? event.account : null;

        if (connectAccountId) {
          if (!isWalkPaymentSession(session)) {
            break;
          }
        } else if (isWalkPaymentSession(session)) {
          break;
        }

        await handleCheckoutSessionCompleted(session);
        break;
      }
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        break;
    }
  } catch (error) {
    console.error("stripe webhook handler error", error);
    return NextResponse.json({ error: "Webhook handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
