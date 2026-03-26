-- Integration credentials (per partner, per integration type)
CREATE TABLE integration_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL,

  credentials JSONB NOT NULL DEFAULT '{}',

  is_active BOOLEAN DEFAULT true,
  last_verified_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(partner_id, integration_type)
);

-- User roles (maps auth.users to roles within tenants)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('customer', 'partner_admin', 'platform_admin')),

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(auth_user_id, partner_id, role)
);

CREATE INDEX idx_user_roles_auth_user ON user_roles(auth_user_id);
CREATE INDEX idx_user_roles_partner ON user_roles(partner_id);
