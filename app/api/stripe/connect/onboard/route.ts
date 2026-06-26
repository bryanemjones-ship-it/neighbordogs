import { NextResponse } from "next/server";
import {
  createStripeConnectOnboardingLink,
  ensureStripeConnectAccount,
} from "@/features/billing/lib/stripe-connect";
import { getUserFromRequest } from "@/shared/lib/supabase-auth";

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accountId = await ensureStripeConnectAccount(user.id, user.email);
    const url = await createStripeConnectOnboardingLink(accountId);

    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stripe Connect failed";
    console.error("stripe connect onboard error", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
