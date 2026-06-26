import type Stripe from "stripe";
import { getAppOrigin, getStripeClient } from "@/features/billing/lib/stripe";
import { quoteWalkPriceCents } from "@/features/booking/lib/operator-prices";
import {
  resolveOperatorById,
  resolveOperatorBySlug,
} from "@/features/booking/lib/operator-resolve";
import { createSupabaseServerClient } from "@/shared/lib/supabase";

export type WalkCheckoutMetadata = {
  booking_id: string;
  operator_id: string;
  operator_slug: string;
  walk_type: string;
  price_cents: string;
  platform_fee_cents: string;
  claim_type: "walk_payment";
};

export type CreateWalkCheckoutInput = {
  operatorSlug?: string;
  operatorId?: string;
  walkType: string;
  dogCount: number;
  nickname: string;
  email?: string;
  type: string;
  date: string;
  start: string;
  end?: string;
  blockedEnd?: string;
  locationLabel?: string;
  serviceAddress?: string;
  serviceLat?: number;
  serviceLng?: number;
  serviceMiles?: number;
  isEmergency?: boolean;
};

export class WalkCheckoutError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "WalkCheckoutError";
    this.status = status;
  }
}

function normalizeWalkType(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (["20", "30", "60", "emergency"].includes(normalized)) {
    return normalized;
  }
  throw new WalkCheckoutError("Invalid walk type.", 400);
}

async function resolveOperator(input: CreateWalkCheckoutInput) {
  const operator = input.operatorSlug
    ? await resolveOperatorBySlug(input.operatorSlug)
    : input.operatorId
      ? await resolveOperatorById(input.operatorId)
      : null;

  if (!operator) {
    throw new WalkCheckoutError("Operator not found.", 404);
  }

  const stripeConnectId = operator.stripeConnectId;
  if (!stripeConnectId) {
    throw new WalkCheckoutError(
      "This operator has not finished Stripe Connect setup.",
      400,
    );
  }

  return operator;
}

export async function createWalkCheckoutSession(
  input: CreateWalkCheckoutInput,
): Promise<{ url: string; bookingId: string }> {
  const walkType = normalizeWalkType(input.walkType);

  if (!input.date || !input.start) {
    throw new WalkCheckoutError("date and start are required.", 400);
  }

  if (!input.nickname.trim()) {
    throw new WalkCheckoutError("Customer name is required.", 400);
  }

  const dogCount = Math.max(1, Math.min(10, Number(input.dogCount) || 1));
  const operator = await resolveOperator(input);
  const stripeConnectId = operator.stripeConnectId as string;
  const quote = quoteWalkPriceCents(operator.prices, {
    walkType,
    dogCount,
    date: input.date,
    start: input.start,
    isEmergency: input.isEmergency || walkType === "emergency",
  });

  const platformFeeCents = 0;

  const supabase = createSupabaseServerClient();
  const customerEmail = input.email?.trim().toLowerCase() || "";

  const { data: booking, error: insertError } = await supabase
    .from("bookings")
    .insert({
      customer_id: null,
      customer_name: input.nickname.trim(),
      customer_email: customerEmail,
      operator_id: operator.id,
      type: input.type,
      date: input.date,
      start_time: input.start,
      end_time: input.end || quote.end,
      blocked_end_time: input.blockedEnd || quote.blockedEnd,
      price_cents: quote.priceCents,
      platform_fee_cents: platformFeeCents,
      stripe_connect_account_id: stripeConnectId,
      payment_status: "unpaid",
      status: "pending",
      is_emergency: input.isEmergency || walkType === "emergency",
      is_weekly_package: false,
      service_address: input.serviceAddress || null,
      location_label: input.locationLabel || "primary",
      dog_count: dogCount,
      buddy_addon_cents: quote.buddyAddonCents,
      test_flag: true,
    })
    .select("id")
    .single();

  if (insertError || !booking?.id) {
    console.error("[walk-checkout] booking insert error", insertError);
    throw new WalkCheckoutError("Could not create booking.", 500);
  }

  const bookingId = booking.id as string;
  const stripe = getStripeClient();
  const origin = getAppOrigin();
  const slugSegment = operator.slug || input.operatorSlug || "book";

  const metadata: WalkCheckoutMetadata = {
    booking_id: bookingId,
    operator_id: operator.id,
    operator_slug: operator.slug || input.operatorSlug || "",
    walk_type: walkType,
    price_cents: String(quote.priceCents),
    platform_fee_cents: String(platformFeeCents),
    claim_type: "walk_payment",
  };

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customerEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: input.type || "Dog Walk",
              description: `${input.date} at ${input.start}`,
            },
            unit_amount: quote.priceCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        on_behalf_of: stripeConnectId,
        transfer_data: {
          destination: stripeConnectId,
        },
        metadata,
      },
      metadata,
      success_url: `${origin}/book/${encodeURIComponent(slugSegment)}?checkout=success&booking_id=${bookingId}`,
      cancel_url: `${origin}/book/${encodeURIComponent(slugSegment)}?checkout=cancelled&booking_id=${bookingId}`,
    });
  } catch (error) {
    await supabase.from("bookings").delete().eq("id", bookingId);
    console.error("[walk-checkout] stripe session error", error);
    throw new WalkCheckoutError("Could not start Stripe Checkout.", 500);
  }

  const { error: updateError } = await supabase
    .from("bookings")
    .update({ stripe_checkout_session_id: session.id })
    .eq("id", bookingId);

  if (updateError) {
    console.error("[walk-checkout] session id update error", updateError);
  }

  if (!session.url) {
    throw new WalkCheckoutError("Stripe did not return a checkout URL.", 500);
  }

  return { url: session.url, bookingId };
}
