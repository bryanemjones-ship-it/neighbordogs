CREATE TABLE IF NOT EXISTS test_demo_walkers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  test_flag boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS test_demo_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  name text,
  approved boolean NOT NULL DEFAULT false,
  meet_and_greet_completed boolean NOT NULL DEFAULT false,
  test_flag boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS test_demo_dogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES test_demo_customers(id) ON DELETE CASCADE,
  name text NOT NULL,
  test_flag boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS test_demo_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES test_demo_customers(id) ON DELETE CASCADE,
  walker_id uuid REFERENCES test_demo_walkers(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'scheduled',
  scheduled_at timestamptz,
  test_flag boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS test_demo_walks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES test_demo_bookings(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  test_flag boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS test_demo_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  walk_id uuid NOT NULL REFERENCES test_demo_walks(id) ON DELETE CASCADE,
  content jsonb DEFAULT '{}',
  test_flag boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS test_demo_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES test_demo_bookings(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  test_flag boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE test_demo_walkers ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_demo_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_demo_dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_demo_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_demo_walks ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_demo_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_demo_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "test_demo_service" ON test_demo_walkers FOR ALL USING (test_flag = true);
CREATE POLICY "test_demo_service" ON test_demo_customers FOR ALL USING (test_flag = true);
CREATE POLICY "test_demo_service" ON test_demo_dogs FOR ALL USING (test_flag = true);
CREATE POLICY "test_demo_service" ON test_demo_bookings FOR ALL USING (test_flag = true);
CREATE POLICY "test_demo_service" ON test_demo_walks FOR ALL USING (test_flag = true);
CREATE POLICY "test_demo_service" ON test_demo_reports FOR ALL USING (test_flag = true);
CREATE POLICY "test_demo_service" ON test_demo_payments FOR ALL USING (test_flag = true);
