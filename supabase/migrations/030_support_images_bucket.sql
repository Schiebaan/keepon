-- Storage-bucket voor screenshots in support-artikelen.
--
-- Publiek want de URLs staan in de markdown en moeten door elke bezoeker van
-- /support geladen kunnen worden. Uploads gaan uitsluitend via het admin
-- endpoint (/api/support/admin/upload-image) met service-role key — de
-- editor-UI in /admin/support/[id] is de enige entry.

INSERT INTO storage.buckets (id, name, public)
VALUES ('support-images', 'support-images', true)
ON CONFLICT (id) DO NOTHING;
