-- Migration: Inbound Referrals Queue Schema
-- Description: Creates inbound_referrals table for external referral submissions from website

-- Create enum type for inbound referral status
CREATE TYPE inbound_referral_status AS ENUM ('PENDING', 'CONVERTED', 'REJECTED');

-- Inbound Referrals table (for external submissions from website)
-- All fields are stored as strings initially as they come from the website
CREATE TABLE inbound_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Raw patient information (all strings from website)
    patient_full_name VARCHAR(255),
    patient_first_name VARCHAR(255),
    patient_last_name VARCHAR(255),
    patient_dob VARCHAR(50), -- Stored as string, needs validation before conversion
    patient_phone VARCHAR(50),
    patient_email VARCHAR(255),
    
    -- Raw referral details
    referral_reason VARCHAR(255),
    referral_reason_other TEXT,
    notes TEXT,
    scheduling_preference VARCHAR(255),
    
    -- Raw provider/practice information (may not match existing records)
    provider_name VARCHAR(255), -- Free-form provider name from website
    practice_name VARCHAR(255), -- Free-form practice name from website
    provider_email VARCHAR(255),
    provider_phone VARCHAR(50),
    practice_phone VARCHAR(50),
    practice_fax VARCHAR(50),
    
    -- Communication preferences
    communication_preference VARCHAR(50),
    communication_value VARCHAR(255),
    
    -- Processing status
    status inbound_referral_status DEFAULT 'PENDING',
    
    -- If converted, link to the created referral
    converted_referral_id UUID REFERENCES referrals(id) ON DELETE SET NULL,
    converted_at TIMESTAMPTZ,
    converted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- If rejected, store reason
    rejection_reason TEXT,
    rejected_at TIMESTAMPTZ,
    rejected_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Additional metadata
    source VARCHAR(50) DEFAULT 'website', -- Source of the referral (website, api, etc.)
    raw_json JSONB, -- Store the complete original JSON payload for reference
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_inbound_referrals_status ON inbound_referrals(status);
CREATE INDEX idx_inbound_referrals_created_at ON inbound_referrals(created_at);
CREATE INDEX idx_inbound_referrals_patient_name ON inbound_referrals(patient_full_name);
CREATE INDEX idx_inbound_referrals_converted_referral_id ON inbound_referrals(converted_referral_id);

-- Trigger for updated_at
CREATE TRIGGER update_inbound_referrals_updated_at
    BEFORE UPDATE ON inbound_referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE inbound_referrals ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view inbound referrals
CREATE POLICY "Authenticated users can view inbound_referrals"
    ON inbound_referrals FOR SELECT
    TO authenticated
    USING (true);

-- Authenticated users can update inbound referrals (for conversion/rejection)
CREATE POLICY "Authenticated users can update inbound_referrals"
    ON inbound_referrals FOR UPDATE
    TO authenticated
    USING (true);

-- Service role full access (for API route that receives submissions)
CREATE POLICY "Service role full access to inbound_referrals"
    ON inbound_referrals FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

COMMENT ON TABLE inbound_referrals IS 'Queue for external referral submissions from website before normalization';
COMMENT ON COLUMN inbound_referrals.raw_json IS 'Complete original JSON payload for audit/debugging';
COMMENT ON COLUMN inbound_referrals.status IS 'PENDING: awaiting processing, CONVERTED: turned into referral, REJECTED: discarded';
