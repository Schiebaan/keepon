-- Enable RLS on all tables
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_module_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is platform admin
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM user_roles
    WHERE auth_user_id = auth.uid()
      AND role = 'platform_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: get customer's partner_id
CREATE OR REPLACE FUNCTION get_customer_partner_id()
RETURNS UUID AS $$
  SELECT partner_id FROM customers
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: get user's role for a specific partner
CREATE OR REPLACE FUNCTION get_user_role(p_partner_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM user_roles
  WHERE auth_user_id = auth.uid()
    AND (partner_id = p_partner_id OR role = 'platform_admin')
  ORDER BY CASE role WHEN 'platform_admin' THEN 0 WHEN 'partner_admin' THEN 1 ELSE 2 END
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PARTNERS: platform admins see all, others see their own partner
CREATE POLICY partners_select ON partners FOR SELECT USING (
  is_platform_admin()
  OR id IN (SELECT partner_id FROM user_roles WHERE auth_user_id = auth.uid())
  OR id = get_customer_partner_id()
);

CREATE POLICY partners_insert ON partners FOR INSERT WITH CHECK (is_platform_admin());
CREATE POLICY partners_update ON partners FOR UPDATE USING (is_platform_admin());

-- CUSTOMERS: own record or partner/platform admin
CREATE POLICY customers_select ON customers FOR SELECT USING (
  auth_user_id = auth.uid()
  OR get_user_role(partner_id) IN ('partner_admin', 'platform_admin')
  OR is_platform_admin()
);

CREATE POLICY customers_insert ON customers FOR INSERT WITH CHECK (
  get_user_role(partner_id) IN ('partner_admin', 'platform_admin')
  OR is_platform_admin()
);

CREATE POLICY customers_update ON customers FOR UPDATE USING (
  auth_user_id = auth.uid()
  OR get_user_role(partner_id) IN ('partner_admin', 'platform_admin')
  OR is_platform_admin()
);

-- INSTALLATIONS: customer sees own, partner admin sees partner's
CREATE POLICY installations_select ON installations FOR SELECT USING (
  customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  OR get_user_role(partner_id) IN ('partner_admin', 'platform_admin')
  OR is_platform_admin()
);

CREATE POLICY installations_insert ON installations FOR INSERT WITH CHECK (
  customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  OR get_user_role(partner_id) IN ('partner_admin', 'platform_admin')
  OR is_platform_admin()
);

CREATE POLICY installations_update ON installations FOR UPDATE USING (
  customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  OR get_user_role(partner_id) IN ('partner_admin', 'platform_admin')
  OR is_platform_admin()
);

-- MODULE_DEFINITIONS: readable by everyone (product catalog)
CREATE POLICY module_defs_select ON module_definitions FOR SELECT USING (true);
CREATE POLICY module_defs_manage ON module_definitions FOR ALL USING (is_platform_admin());

-- PARTNER_MODULE_CONFIGS: visible to users of that partner
CREATE POLICY partner_modules_select ON partner_module_configs FOR SELECT USING (
  partner_id = get_customer_partner_id()
  OR get_user_role(partner_id) IN ('partner_admin', 'platform_admin')
  OR is_platform_admin()
);

CREATE POLICY partner_modules_update ON partner_module_configs FOR UPDATE USING (
  get_user_role(partner_id) IN ('partner_admin', 'platform_admin')
  OR is_platform_admin()
);

CREATE POLICY partner_modules_insert ON partner_module_configs FOR INSERT WITH CHECK (
  get_user_role(partner_id) IN ('partner_admin', 'platform_admin')
  OR is_platform_admin()
);

-- SUBSCRIPTIONS: customer sees own, partner admin sees partner's
CREATE POLICY subscriptions_select ON subscriptions FOR SELECT USING (
  customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  OR is_platform_admin()
);

CREATE POLICY subscriptions_insert ON subscriptions FOR INSERT WITH CHECK (
  customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  OR is_platform_admin()
);

CREATE POLICY subscriptions_update ON subscriptions FOR UPDATE USING (
  customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  OR is_platform_admin()
);

-- PAYMENTS: customer sees own
CREATE POLICY payments_select ON payments FOR SELECT USING (
  customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  OR is_platform_admin()
);

-- INTEGRATION_CREDENTIALS: only partner/platform admins
CREATE POLICY creds_select ON integration_credentials FOR SELECT USING (
  get_user_role(partner_id) IN ('partner_admin', 'platform_admin')
  OR is_platform_admin()
);

CREATE POLICY creds_manage ON integration_credentials FOR ALL USING (
  is_platform_admin()
);

-- USER_ROLES: users see own roles
CREATE POLICY roles_select ON user_roles FOR SELECT USING (
  auth_user_id = auth.uid()
  OR is_platform_admin()
);

CREATE POLICY roles_manage ON user_roles FOR ALL USING (is_platform_admin());

-- AUDIT_LOG: partner admin sees partner's, platform admin sees all
CREATE POLICY audit_select ON audit_log FOR SELECT USING (
  is_platform_admin()
  OR get_user_role(partner_id) = 'partner_admin'
);
