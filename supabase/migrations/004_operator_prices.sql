-- Operator walk pricing (replaces localStorage for admin Pricing panel)
CREATE TABLE IF NOT EXISTS operator_prices (
  operator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  walk_type text NOT NULL,
  price_cents integer NOT NULL,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (operator_id, walk_type),
  CHECK (walk_type IN ('w20', 'w30', 'w60', 'emergency', 'buddyAddon', 'weeklyDiscount'))
);

CREATE INDEX IF NOT EXISTS idx_operator_prices_operator ON operator_prices(operator_id);

ALTER TABLE operator_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "operator_prices_select_own" ON operator_prices
  FOR SELECT TO authenticated
  USING (auth.uid() = operator_id);

CREATE POLICY "operator_prices_insert_own" ON operator_prices
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = operator_id);

CREATE POLICY "operator_prices_update_own" ON operator_prices
  FOR UPDATE TO authenticated
  USING (auth.uid() = operator_id);

CREATE POLICY "operator_prices_delete_own" ON operator_prices
  FOR DELETE TO authenticated
  USING (auth.uid() = operator_id);

DROP TRIGGER IF EXISTS operator_prices_updated ON operator_prices;
CREATE TRIGGER operator_prices_updated
  BEFORE UPDATE ON operator_prices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
