-- NeighborDogs schema: territories, subscriptions, teams, resale
-- Run in Supabase SQL editor or via supabase db push

-- App config: benchmark and BASE_OPPORTUNITY (set once via API/admin)
CREATE TABLE IF NOT EXISTS app_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Territory: center + radius only (no stored polygon)
CREATE TABLE IF NOT EXISTS territories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  center_lat double precision NOT NULL,
  center_lng double precision NOT NULL,
  radius_miles double precision NOT NULL,
  estimated_homes integer NOT NULL,
  opportunity_pct double precision NOT NULL,
  anchor_address text NOT NULL,
  is_smaller_fallback boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Subscription: one per territory, links to Stripe
CREATE TABLE IF NOT EXISTS territory_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  territory_id uuid NOT NULL REFERENCES territories(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id text,
  stripe_customer_id text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid')),
  monthly_cents integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(territory_id)
);

CREATE INDEX IF NOT EXISTS idx_territory_subs_owner ON territory_subscriptions(owner_id);
CREATE INDEX IF NOT EXISTS idx_territory_subs_stripe ON territory_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_territory_subs_status ON territory_subscriptions(status);

-- Profiles: optional display name / contact for owners
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  updated_at timestamptz DEFAULT now()
);

-- Team: territory owner can add unlimited members
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  territory_id uuid NOT NULL REFERENCES territories(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_teams_territory ON teams(territory_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);

-- Resale listing: territory listed on AppStack marketplace
CREATE TABLE IF NOT EXISTS resale_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  territory_id uuid NOT NULL REFERENCES territories(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_price_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'withdrawn')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resale_territory ON resale_listings(territory_id);
CREATE INDEX IF NOT EXISTS idx_resale_status ON resale_listings(status);

-- Resale contract acceptance (buyer accepts terms)
CREATE TABLE IF NOT EXISTS resale_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resale_listing_id uuid NOT NULL REFERENCES resale_listings(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accepted_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text
);

-- Enable RLS
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE territory_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE resale_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE resale_contracts ENABLE ROW LEVEL SECURITY;

-- app_config: read for all (needed for BASE_OPPORTUNITY), write by service role only
CREATE POLICY "app_config_select" ON app_config FOR SELECT TO anon, authenticated USING (true);

-- territories: read for all (map shows owned territories), insert/update for purchase flow
CREATE POLICY "territories_select" ON territories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "territories_insert" ON territories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "territories_update" ON territories FOR UPDATE TO authenticated USING (true);

-- territory_subscriptions: users see own; insert/update in purchase flow
CREATE POLICY "subs_select_own" ON territory_subscriptions FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "subs_insert" ON territory_subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "subs_update_own" ON territory_subscriptions FOR UPDATE TO authenticated USING (auth.uid() = owner_id);

-- For map: allow reading all active subscriptions (to show owned territories)
CREATE POLICY "subs_select_active" ON territory_subscriptions FOR SELECT TO anon, authenticated USING (status = 'active');

-- profiles
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_upsert" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- teams: owner manages; members read
CREATE POLICY "teams_select" ON teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "teams_insert" ON teams FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "teams_update_owner" ON teams FOR UPDATE TO authenticated USING (auth.uid() = owner_id);

CREATE POLICY "team_members_select" ON team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "team_members_insert" ON team_members FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM teams t WHERE t.id = team_id AND t.owner_id = auth.uid())
);
CREATE POLICY "team_members_delete" ON team_members FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM teams t WHERE t.id = team_id AND t.owner_id = auth.uid())
);

-- resale_listings: public read active; seller manages own
CREATE POLICY "resale_select" ON resale_listings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "resale_insert" ON resale_listings FOR INSERT TO authenticated WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "resale_update_seller" ON resale_listings FOR UPDATE TO authenticated USING (auth.uid() = seller_id);

CREATE POLICY "resale_contracts_select" ON resale_contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "resale_contracts_insert" ON resale_contracts FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);

-- Trigger to set updated_at
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS territories_updated ON territories;
CREATE TRIGGER territories_updated BEFORE UPDATE ON territories FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS territory_subscriptions_updated ON territory_subscriptions;
CREATE TRIGGER territory_subscriptions_updated BEFORE UPDATE ON territory_subscriptions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS teams_updated ON teams;
CREATE TRIGGER teams_updated BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS resale_listings_updated ON resale_listings;
CREATE TRIGGER resale_listings_updated BEFORE UPDATE ON resale_listings FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Seed BASE_OPPORTUNITY (run after benchmark calculation; or set via API)
-- INSERT INTO app_config (key, value) VALUES ('benchmark', '{"address":"5324 Inglewood Lane, Raleigh, NC 27609","radius_miles":1.5,"base_opportunity":0}'::jsonb) ON CONFLICT (key) DO NOTHING;
