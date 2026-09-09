
CREATE POLICY "shared attachments read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'attachments');
CREATE POLICY "shared attachments write" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'attachments');
CREATE POLICY "shared attachments update" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'attachments');
CREATE POLICY "shared attachments delete" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'attachments');
