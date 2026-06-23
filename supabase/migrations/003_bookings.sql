-- Bookings: scheduled walks (client booking + admin schedule)
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES test_demo_customers(id) ON DELETE SET NULL,
  walker_id uuid REFERENCES test_demo_walkers(id) ON DELETE SET NULL,
  customer_name text,
  customer_email text,
  type text NOT NULL,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  blocked_end_time time NOT NULL,
  price_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  is_emergency boolean NOT NULL DEFAULT false,
  is_weekly_package boolean NOT NULL DEFAULT false,
  service_address text,
  location_label text DEFAULT 'primary',
  dog_count integer NOT NULL DEFAULT 1,
  buddy_addon_cents integer NOT NULL DEFAULT 0,
  test_flag boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookings_service" ON bookings FOR ALL USING (test_flag = true);
