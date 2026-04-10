-- 013: Customer documents (dossier)
CREATE TABLE customer_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES partners(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('factuur', 'datasheet', 'opleverdocument', 'garantiebewijs', 'offerte', 'overig')),
  file_path TEXT NOT NULL,
  file_size_bytes BIGINT,
  mime_type TEXT,
  notes TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_customer_documents_customer ON customer_documents(customer_id);
CREATE INDEX idx_customer_documents_partner ON customer_documents(partner_id);

-- RLS
ALTER TABLE customer_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers read own documents" ON customer_documents
  FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Partner admins manage documents" ON customer_documents
  FOR ALL USING (is_platform_admin() OR partner_id IN (
    SELECT partner_id FROM user_roles WHERE user_id = auth.uid() AND role = 'partner_admin'
  ));

-- Supabase Storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('customer-documents', 'customer-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: partner admins can upload/read, customers can read own
CREATE POLICY "Partner admins manage files" ON storage.objects
  FOR ALL USING (
    bucket_id = 'customer-documents'
    AND (is_platform_admin() OR EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'partner_admin'
    ))
  );

CREATE POLICY "Customers read own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'customer-documents'
    AND (storage.foldername(name))[2] IN (
      SELECT id::text FROM customers WHERE auth_user_id = auth.uid()
    )
  );
