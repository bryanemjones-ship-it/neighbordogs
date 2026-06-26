import { createSupabaseServerClient } from "@/shared/lib/supabase";
import type { LegacyPrices } from "@/features/booking/lib/models";
import { fetchOperatorPrices } from "@/features/booking/lib/operator-prices";

export type ResolvedOperator = {
  id: string;
  slug: string;
  fullName: string | null;
  email: string | null;
  stripeConnectId: string | null;
  prices: LegacyPrices;
};

export async function resolveOperatorBySlug(
  slug: string,
): Promise<ResolvedOperator | null> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const supabase = createSupabaseServerClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, slug, full_name, email, stripe_connect_id")
    .ilike("slug", normalized)
    .maybeSingle();

  if (error) {
    console.error("resolveOperatorBySlug error", error);
    return null;
  }

  if (!profile?.id || !profile.slug) {
    return null;
  }

  const prices = await fetchOperatorPrices(supabase, profile.id);

  return {
    id: profile.id,
    slug: profile.slug,
    fullName: profile.full_name,
    email: profile.email,
    stripeConnectId: profile.stripe_connect_id ?? null,
    prices,
  };
}

export async function resolveOperatorById(
  operatorId: string,
): Promise<ResolvedOperator | null> {
  const normalized = operatorId.trim();
  if (!normalized) {
    return null;
  }

  const supabase = createSupabaseServerClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, slug, full_name, email, stripe_connect_id")
    .eq("id", normalized)
    .maybeSingle();

  if (error) {
    console.error("resolveOperatorById error", error);
    return null;
  }

  if (!profile?.id) {
    return null;
  }

  const prices = await fetchOperatorPrices(supabase, profile.id);

  return {
    id: profile.id,
    slug: profile.slug || "",
    fullName: profile.full_name,
    email: profile.email,
    stripeConnectId: profile.stripe_connect_id ?? null,
    prices,
  };
}
