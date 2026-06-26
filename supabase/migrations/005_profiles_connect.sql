-- Operator profile fields for public booking URL and Stripe Connect payouts
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS stripe_connect_id text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_slug
  ON profiles(slug)
  WHERE slug IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_stripe_connect_id
  ON profiles(stripe_connect_id)
  WHERE stripe_connect_id IS NOT NULL;
