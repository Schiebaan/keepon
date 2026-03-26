-- Subscriptions (active modules per customer per installation)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  installation_id UUID NOT NULL REFERENCES installations(id) ON DELETE CASCADE,
  partner_module_config_id UUID NOT NULL REFERENCES partner_module_configs(id),

  status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment', 'active', 'paused', 'cancelled', 'expired')),

  billing_interval TEXT NOT NULL CHECK (billing_interval IN ('monthly', 'yearly')),
  price_cents INTEGER NOT NULL,

  -- Mollie
  mollie_subscription_id TEXT,
  mollie_mandate_id TEXT,

  -- Integration
  external_device_id TEXT,
  integration_status TEXT DEFAULT 'pending'
    CHECK (integration_status IN ('pending', 'linking', 'active', 'error')),
  integration_meta JSONB DEFAULT '{}',

  -- Terms
  terms_accepted_at TIMESTAMPTZ,
  terms_version TEXT,

  activated_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subscriptions_customer ON subscriptions(customer_id);
CREATE INDEX idx_subscriptions_installation ON subscriptions(installation_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
