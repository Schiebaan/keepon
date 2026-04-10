-- 015: Fix RLS issues
-- 1. Fix recursive policy on user_roles (uses is_platform_admin() SECURITY DEFINER instead of self-referencing query)
DROP POLICY IF EXISTS "Platform admins manage roles" ON user_roles;
CREATE POLICY "Platform admins manage roles" ON user_roles
  FOR ALL USING (is_platform_admin());

-- 2. Add partner_admin access to subscriptions
CREATE POLICY "Partner admins read subscriptions" ON subscriptions
  FOR SELECT USING (
    is_platform_admin()
    OR customer_id IN (
      SELECT c.id FROM customers c
      JOIN user_roles ur ON ur.partner_id = c.partner_id
      WHERE ur.user_id = auth.uid() AND ur.role = 'partner_admin'
    )
  );

-- 3. Add missing updated_at triggers on core tables
CREATE TRIGGER set_updated_at_partners
  BEFORE UPDATE ON partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_customers
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_installations
  BEFORE UPDATE ON installations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_subscriptions
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_partner_module_configs
  BEFORE UPDATE ON partner_module_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 4. Add email_templates table for partner-customizable emails
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  subject TEXT NOT NULL,
  heading TEXT NOT NULL,
  body TEXT NOT NULL,
  button_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(partner_id, type)
);

CREATE INDEX idx_email_templates_partner ON email_templates(partner_id);

CREATE TRIGGER set_updated_at_email_templates
  BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partner admins manage own templates" ON email_templates
  FOR ALL USING (
    is_platform_admin()
    OR partner_id IN (SELECT partner_id FROM user_roles WHERE user_id = auth.uid() AND role = 'partner_admin')
  );
