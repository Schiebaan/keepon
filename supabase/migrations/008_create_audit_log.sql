-- Audit log (immutable trail)
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id),
  partner_id UUID REFERENCES partners(id),

  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,

  meta JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_log_partner ON audit_log(partner_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);
