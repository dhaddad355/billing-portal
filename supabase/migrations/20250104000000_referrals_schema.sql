-- Migration: Referrals Feature Schema
-- Description: Creates tables for practices, providers, referrals, and referral notes

-- Enable pg_trgm extension for fuzzy search (must be first)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create enum types for referral status and sub-status
CREATE TYPE referral_status AS ENUM ('OPEN', 'CLOSED');
CREATE TYPE referral_sub_status AS ENUM ('Scheduling', 'Appointment', 'Quote', 'Procedure', 'Post-Op');
CREATE TYPE communication_preference AS ENUM ('Email', 'Fax');
CREATE TYPE referral_reason AS ENUM ('Laser Vision Correction', 'Cataract Consultation', 'Other');
CREATE TYPE scheduling_preference AS ENUM ('Call Patient', 'SMS Patient', 'Email Patient', 'Patient Instructed To Call');

-- Practices/Locations table
CREATE TABLE practices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    phone VARCHAR(20),
    fax VARCHAR(20),
    website VARCHAR(255),
    communication_preference communication_preference DEFAULT 'Fax',
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Providers (referring physicians) table
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_id UUID REFERENCES practices(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    degree VARCHAR(50), -- e.g., MD, DO, OD, etc.
    email VARCHAR(255),
    phone VARCHAR(20),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referrals table
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
    practice_id UUID REFERENCES practices(id) ON DELETE SET NULL,
    
    -- Patient information
    patient_full_name VARCHAR(255) NOT NULL,
    patient_dob DATE NOT NULL,
    patient_phone VARCHAR(20),
    patient_email VARCHAR(255),
    
    -- Referral details
    referral_reason referral_reason NOT NULL,
    referral_reason_other TEXT, -- Used when reason is 'Other'
    notes TEXT,
    scheduling_preference scheduling_preference NOT NULL,
    
    -- Communication preference for this referral
    communication_preference communication_preference NOT NULL,
    communication_value VARCHAR(255), -- Email address or fax number
    
    -- Status tracking
    status referral_status DEFAULT 'OPEN',
    sub_status referral_sub_status DEFAULT 'Scheduling',
    
    -- Audit fields
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referral notes/timeline table
CREATE TABLE referral_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    note TEXT NOT NULL,
    note_type VARCHAR(50) DEFAULT 'manual', -- 'manual', 'status_change', 'system'
    previous_status referral_status,
    new_status referral_status,
    previous_sub_status referral_sub_status,
    new_sub_status referral_sub_status,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_providers_practice_id ON providers(practice_id);
CREATE INDEX idx_providers_last_name ON providers(last_name);
CREATE INDEX idx_providers_search ON providers USING gin(
    (first_name || ' ' || last_name) gin_trgm_ops
);

CREATE INDEX idx_referrals_provider_id ON referrals(provider_id);
CREATE INDEX idx_referrals_practice_id ON referrals(practice_id);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE INDEX idx_referrals_sub_status ON referrals(sub_status);
CREATE INDEX idx_referrals_created_at ON referrals(created_at);
CREATE INDEX idx_referrals_patient_name ON referrals(patient_full_name);

CREATE INDEX idx_referral_notes_referral_id ON referral_notes(referral_id);
CREATE INDEX idx_referral_notes_created_at ON referral_notes(created_at);

-- Create search index on practices name
CREATE INDEX idx_practices_name ON practices USING gin(name gin_trgm_ops);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_practices_updated_at
    BEFORE UPDATE ON practices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_providers_updated_at
    BEFORE UPDATE ON providers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referrals_updated_at
    BEFORE UPDATE ON referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_notes ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users (all authenticated users can view/edit)
CREATE POLICY "Authenticated users can view practices"
    ON practices FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert practices"
    ON practices FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update practices"
    ON practices FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can delete practices"
    ON practices FOR DELETE
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can view providers"
    ON providers FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert providers"
    ON providers FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update providers"
    ON providers FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can delete providers"
    ON providers FOR DELETE
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can view referrals"
    ON referrals FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert referrals"
    ON referrals FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update referrals"
    ON referrals FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can view referral_notes"
    ON referral_notes FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert referral_notes"
    ON referral_notes FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Service role policies (for API routes using service role key)
CREATE POLICY "Service role full access to practices"
    ON practices FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to providers"
    ON providers FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to referrals"
    ON referrals FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to referral_notes"
    ON referral_notes FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

COMMENT ON TABLE practices IS 'Physical office locations where referring providers work';
COMMENT ON TABLE providers IS 'Referring physicians/doctors who send patients';
COMMENT ON TABLE referrals IS 'Patient referrals from providers';
COMMENT ON TABLE referral_notes IS 'Timeline of notes and status changes for referrals';
