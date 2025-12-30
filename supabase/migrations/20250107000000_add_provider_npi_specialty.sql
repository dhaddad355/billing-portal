-- Migration: Add NPI and Specialty fields to providers table
-- Description: Adds NPI (National Provider Identifier) and Specialty fields to providers table for CSV import support

-- Add NPI field to providers table
ALTER TABLE providers
ADD COLUMN npi VARCHAR(10);

-- Add specialty field to providers table  
ALTER TABLE providers
ADD COLUMN specialty VARCHAR(100);

-- Add index on NPI for faster lookups and duplicate detection
CREATE INDEX idx_providers_npi ON providers(npi) WHERE npi IS NOT NULL;

-- Add constraint to ensure NPI is unique when not null
CREATE UNIQUE INDEX idx_providers_npi_unique ON providers(npi) WHERE npi IS NOT NULL;

-- Add comment
COMMENT ON COLUMN providers.npi IS 'National Provider Identifier - 10 digit unique identifier';
COMMENT ON COLUMN providers.specialty IS 'Provider medical specialty (e.g., Optometry, Ophthalmology)';
