-- Align production public.bookings with codebase booking features (additive only).
-- Does NOT create bookings, does NOT add test_flag.
-- Safe to run whether or not 006 was previously applied (idempotent).
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS blocked_end_time time,
  ADD COLUMN IF NOT EXISTS buddy_addon_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS customer_email text,
  ADD COLUMN IF NOT EXISTS dog_count integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_weekly_package boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS location_label text DEFAULT 'primary',
  ADD COLUMN IF NOT EXISTS operator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS platform_fee_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS service_address text,
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text,
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
ALTER TABLE bookings
  ADD CONSTRAINT bookings_payment_status_check
  CHECK (payment_status IN ('unpaid', 'paid', 'failed', 'refunded', 'cancelled'));
CREATE INDEX IF NOT EXISTS idx_bookings_operator ON bookings(operator_id);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_stripe_checkout_session_unique
  ON bookings(stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;
