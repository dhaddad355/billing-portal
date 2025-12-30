-- =====================================================================
-- Storage Bucket Setup for Supabase
-- Run this in the Supabase SQL Editor after creating the 'statements' bucket
-- =====================================================================

-- Note: Create the bucket via Supabase Dashboard first:
-- 1. Go to Storage → New Bucket
-- 2. Name: statements
-- 3. Public: OFF (private)
-- 4. Then run this SQL

-- =====================================================================
-- Storage Policies
-- =====================================================================

-- Since we use the service role key (which bypasses RLS), these policies
-- are optional but provide an extra layer of security

-- Policy: Only service role can upload files
CREATE POLICY "Service role can upload files"
ON storage.objects FOR INSERT
WITH CHECK (
  auth.role() = 'service_role'
);

-- Policy: Only service role can update files
CREATE POLICY "Service role can update files"
ON storage.objects FOR UPDATE
USING (
  auth.role() = 'service_role'
);

-- Policy: Only service role can delete files
CREATE POLICY "Service role can delete files"
ON storage.objects FOR DELETE
USING (
  auth.role() = 'service_role'
);

-- Policy: Only service role can read files (signed URLs bypass this)
CREATE POLICY "Service role can read files"
ON storage.objects FOR SELECT
USING (
  auth.role() = 'service_role'
);

-- =====================================================================
-- File Organization
-- =====================================================================
-- 
-- PDF files are stored with the following path structure:
-- {person_id}/{statement_date}/{statement_uuid}.pdf
--
-- Example: 11111111-2222-3333-4444-555555555555/2025-01-15/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.pdf
--
-- This allows for:
-- - Easy organization by patient
-- - Date-based filtering
-- - Unique filenames to prevent collisions
-- =====================================================================
