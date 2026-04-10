-- 014: Smart meters
CREATE TABLE smart_meters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES partners(id),
  postcode TEXT NOT NULL,
  meter_id TEXT NOT NULL, -- laatste 6 cijfers
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('not_linked', 'pending', 'active', 'error')),
  error_message TEXT,
  linked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(customer_id)
);

CREATE INDEX idx_smart_meters_customer ON smart_meters(customer_id);
CREATE INDEX idx_smart_meters_partner ON smart_meters(partner_id);

CREATE TRIGGER set_updated_at_smart_meters
  BEFORE UPDATE ON smart_meters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Smart meter readings (time-series data)
CREATE TABLE smart_meter_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id UUID NOT NULL REFERENCES smart_meters(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,
  consumption_wh INTEGER NOT NULL DEFAULT 0,
  production_wh INTEGER NOT NULL DEFAULT 0,
  gas_m3 NUMERIC(10,3),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_meter_readings_meter ON smart_meter_readings(meter_id);
CREATE INDEX idx_meter_readings_timestamp ON smart_meter_readings(meter_id, timestamp DESC);

-- RLS
ALTER TABLE smart_meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_meter_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers read own meter" ON smart_meters
  FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Customers manage own meter" ON smart_meters
  FOR ALL USING (
    customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
    OR is_platform_admin()
    OR partner_id IN (SELECT partner_id FROM user_roles WHERE user_id = auth.uid() AND role = 'partner_admin')
  );

CREATE POLICY "Customers read own readings" ON smart_meter_readings
  FOR SELECT USING (
    meter_id IN (
      SELECT sm.id FROM smart_meters sm
      JOIN customers c ON c.id = sm.customer_id
      WHERE c.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "System inserts readings" ON smart_meter_readings
  FOR INSERT WITH CHECK (is_platform_admin());
