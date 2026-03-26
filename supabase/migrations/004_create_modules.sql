-- Module definitions (product catalog - platform level)
CREATE TABLE module_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  integration_type TEXT NOT NULL,

  -- Default pricing (cents)
  default_price_monthly INTEGER,
  default_price_yearly INTEGER,

  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Partner module configs (pricing/settings per partner per module)
CREATE TABLE partner_module_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  module_definition_id UUID NOT NULL REFERENCES module_definitions(id) ON DELETE CASCADE,

  is_enabled BOOLEAN DEFAULT true,
  price_monthly INTEGER NOT NULL,
  price_yearly INTEGER NOT NULL,

  custom_terms TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(partner_id, module_definition_id)
);

CREATE INDEX idx_partner_module_configs_partner ON partner_module_configs(partner_id);
