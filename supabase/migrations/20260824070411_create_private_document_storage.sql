/*
# Create private document storage

## Overview
Adds the private storage bucket used by the knowledge library for uploaded PDFs and presentations.
Objects are kept inside a folder named for the signed-in user, so one learner cannot access another learner's files.

## Storage
- Bucket `documents`: private, 20 MB file limit, PDF and PowerPoint MIME types.

## Security
- Authenticated users can create, read, update, and delete only objects in their own user-id folder.
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('documents', 'documents', false, 20971520, ARRAY[
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 20971520,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "documents_insert_own_folder" ON storage.objects;
CREATE POLICY "documents_insert_own_folder" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "documents_select_own_folder" ON storage.objects;
CREATE POLICY "documents_select_own_folder" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "documents_update_own_folder" ON storage.objects;
CREATE POLICY "documents_update_own_folder" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "documents_delete_own_folder" ON storage.objects;
CREATE POLICY "documents_delete_own_folder" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);