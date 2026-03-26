-- 011: Recreate user_roles table for auth with updated schema
-- Replaces the user_roles table from 007 with a simplified version:
--   - Uses user_id (instead of auth_user_id) for clarity
--   - Adds customer_id reference for customer role binding
--   - UNIQUE(user_id) — one role per user

-- Drop existing RLS policies on user_roles (from 009)
DROP POLICY IF EXISTS roles_select ON user_roles;
DROP POLICY IF EXISTS roles_manage ON user_roles;

-- Drop existing indexes
DROP INDEX IF EXISTS idx_user_roles_auth_user;
DROP INDEX IF EXISTS idx_user_roles_partner;

-- Drop and recreate the table
DROP TABLE IF EXISTS user_roles CASCADE;

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES partners(id),
  role TEXT NOT NULL CHECK (role IN ('platform_admin', 'partner_admin', 'customer')),
  customer_id UUID REFERENCES customers(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_partner ON user_roles(partner_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own role" ON user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Platform admins manage roles" ON user_roles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'platform_admin'
  )
);

-- Recreate helper functions to use new column name (user_id instead of auth_user_id)
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'platform_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_customer_partner_id()
RETURNS UUID AS $$
  SELECT partner_id FROM customers
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_role(p_partner_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM user_roles
  WHERE user_id = auth.uid()
    AND (partner_id = p_partner_id OR role = 'platform_admin')
  ORDER BY CASE role WHEN 'platform_admin' THEN 0 WHEN 'partner_admin' THEN 1 ELSE 2 END
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
