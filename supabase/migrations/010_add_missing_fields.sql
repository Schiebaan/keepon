-- 010: Add missing fields and tables to match TypeScript data model
-- Covers: partners extras, partner_module_configs.min_contract_months,
--         onboarding_records, conversations, conversation_messages, service_tickets

-- ============================================================
-- 1. Partners: add terms_content and terms_placeholders
-- ============================================================
ALTER TABLE partners
  ADD COLUMN IF NOT EXISTS terms_content TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS terms_placeholders JSONB DEFAULT '{}';

-- ============================================================
-- 2. partner_module_configs: add min_contract_months
-- ============================================================
ALTER TABLE partner_module_configs
  ADD COLUMN IF NOT EXISTS min_contract_months INTEGER DEFAULT 12;

-- ============================================================
-- 3. Onboarding records (magic-link onboarding flow)
-- ============================================================
CREATE TABLE IF NOT EXISTS onboarding_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  module_type TEXT NOT NULL,
  gripp_project_id TEXT,
  service_tier TEXT DEFAULT 'slim',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'activated')),
  created_at TIMESTAMPTZ DEFAULT now(),
  activated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_onboarding_records_token ON onboarding_records(token);
CREATE INDEX IF NOT EXISTS idx_onboarding_records_partner ON onboarding_records(partner_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_records_customer ON onboarding_records(customer_id);

-- ============================================================
-- 4. Service tickets (classic ticket model)
-- ============================================================
CREATE TABLE IF NOT EXISTS service_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES partners(id),
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_behandeling', 'opgelost', 'gesloten')),
  urgency TEXT NOT NULL DEFAULT 'normaal'
    CHECK (urgency IN ('laag', 'normaal', 'hoog')),
  module_type TEXT,
  response TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_tickets_customer ON service_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_tickets_partner ON service_tickets(partner_id);
CREATE INDEX IF NOT EXISTS idx_service_tickets_status ON service_tickets(status);

-- ============================================================
-- 5. Conversations (AI service chat — replaces tickets conceptually)
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES partners(id),
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'actief'
    CHECK (status IN ('actief', 'ai_opgelost', 'geescaleerd', 'gesloten')),
  module_type TEXT,
  ai_summary TEXT,
  ai_resolution TEXT,
  requires_visit BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_customer ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_partner ON conversations(partner_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);

-- ============================================================
-- 6. Conversation messages
-- ============================================================
CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('customer', 'ai', 'installer')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation ON conversation_messages(conversation_id);

-- ============================================================
-- 7. RLS for new tables
-- ============================================================

-- Onboarding records
ALTER TABLE onboarding_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY onboarding_select ON onboarding_records FOR SELECT USING (
  customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  OR is_platform_admin()
  OR get_user_role(partner_id) IN ('partner_admin', 'platform_admin')
);

CREATE POLICY onboarding_insert ON onboarding_records FOR INSERT WITH CHECK (
  is_platform_admin()
  OR get_user_role(partner_id) IN ('partner_admin', 'platform_admin')
);

CREATE POLICY onboarding_update ON onboarding_records FOR UPDATE USING (
  customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  OR is_platform_admin()
  OR get_user_role(partner_id) IN ('partner_admin', 'platform_admin')
);

-- Service tickets
ALTER TABLE service_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY tickets_select ON service_tickets FOR SELECT USING (
  customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  OR is_platform_admin()
  OR get_user_role(partner_id) IN ('partner_admin', 'platform_admin')
);

CREATE POLICY tickets_insert ON service_tickets FOR INSERT WITH CHECK (
  customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  OR is_platform_admin()
  OR get_user_role(partner_id) IN ('partner_admin', 'platform_admin')
);

CREATE POLICY tickets_update ON service_tickets FOR UPDATE USING (
  customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  OR is_platform_admin()
  OR get_user_role(partner_id) IN ('partner_admin', 'platform_admin')
);

-- Conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY conversations_select ON conversations FOR SELECT USING (
  customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  OR is_platform_admin()
  OR get_user_role(partner_id) IN ('partner_admin', 'platform_admin')
);

CREATE POLICY conversations_insert ON conversations FOR INSERT WITH CHECK (
  customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  OR is_platform_admin()
  OR get_user_role(partner_id) IN ('partner_admin', 'platform_admin')
);

CREATE POLICY conversations_update ON conversations FOR UPDATE USING (
  customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  OR is_platform_admin()
  OR get_user_role(partner_id) IN ('partner_admin', 'platform_admin')
);

-- Conversation messages
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY messages_select ON conversation_messages FOR SELECT USING (
  conversation_id IN (
    SELECT id FROM conversations
    WHERE customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  )
  OR is_platform_admin()
);

CREATE POLICY messages_insert ON conversation_messages FOR INSERT WITH CHECK (
  conversation_id IN (
    SELECT id FROM conversations
    WHERE customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  )
  OR is_platform_admin()
);

-- ============================================================
-- 8. updated_at trigger for new tables with updated_at column
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_onboarding
  BEFORE UPDATE ON onboarding_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_service_tickets
  BEFORE UPDATE ON service_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_conversations
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
