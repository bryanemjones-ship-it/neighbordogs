import { createSupabaseServerClient } from "@/shared/lib/supabase";
import { getAppOrigin, getStripeClient } from "@/features/billing/lib/stripe";

export async function getProfileConnectId(userId: string): Promise<string | null> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("stripe_connect_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("getProfileConnectId error", error);
    return null;
  }

  return data?.stripe_connect_id ?? null;
}

export async function saveProfileConnectId(
  userId: string,
  email: string | undefined,
  stripeConnectId: string,
): Promise<void> {
  const supabase = createSupabaseServerClient();

  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      email: email ?? null,
      stripe_connect_id: stripeConnectId,
    },
    { onConflict: "id" },
  );

  if (error) {
    throw error;
  }
}

export async function ensureStripeConnectAccount(
  userId: string,
  email: string | undefined,
): Promise<string> {
  const existing = await getProfileConnectId(userId);
  if (existing) {
    return existing;
  }

  const stripe = getStripeClient();
  const account = await stripe.accounts.create({
    type: "standard",
    email: email || undefined,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: "individual",
    metadata: {
      user_id: userId,
    },
  });

  await saveProfileConnectId(userId, email, account.id);
  return account.id;
}

export async function createStripeConnectOnboardingLink(
  accountId: string,
): Promise<string> {
  const stripe = getStripeClient();
  const origin = getAppOrigin();

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/dashboard?tab=pricing&connect=refresh`,
    return_url: `${origin}/dashboard?tab=pricing&connect=complete`,
    type: "account_onboarding",
  });

  return accountLink.url;
}
