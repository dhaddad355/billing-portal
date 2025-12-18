-- Migration: Add attachments support and note visibility
-- Description: Adds file attachment support and public/private note visibility

-- Create enum for note visibility
CREATE TYPE note_visibility AS ENUM ('public', 'private');

-- Add visibility column to referral_notes
ALTER TABLE referral_notes
  ADD COLUMN visibility note_visibility DEFAULT 'public';

-- Create referral_attachments table
CREATE TABLE referral_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for referral_attachments
CREATE INDEX idx_referral_attachments_referral_id ON referral_attachments(referral_id);
CREATE INDEX idx_referral_attachments_created_at ON referral_attachments(created_at);

-- Enable RLS on referral_attachments
ALTER TABLE referral_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_attachments
CREATE POLICY "Authenticated users can view referral_attachments"
    ON referral_attachments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert referral_attachments"
    ON referral_attachments FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can delete referral_attachments"
    ON referral_attachments FOR DELETE
    TO authenticated
    USING (true);

CREATE POLICY "Service role full access to referral_attachments"
    ON referral_attachments FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

COMMENT ON TABLE referral_attachments IS 'File attachments (PDFs, images, documents) for referrals';
COMMENT ON COLUMN referral_notes.visibility IS 'Whether note is visible to provider (public) or internal only (private)';
