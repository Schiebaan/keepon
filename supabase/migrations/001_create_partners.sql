-- Partners (tenants)
CREATE TABLE partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  custom_domain TEXT UNIQUE,

  -- Branding
  logo_url TEXT,
  primary_color TEXT DEFAULT '#1a56db',
  secondary_color TEXT DEFAULT '#f3f4f6',

  -- Config
  terms_url TEXT,
  support_email TEXT,
  support_phone TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_partners_slug ON partners(slug);
CREATE INDEX idx_partners_custom_domain ON partners(custom_domain);
