-- Migration: Quotes Feature Schema
-- Description: Creates tables for quotes, pricing grid, discounts, add-ons, and financing settings

-- Enum types for quotes
CREATE TYPE refractive_error AS ENUM ('Myopia', 'Hyperopia', 'Presbyopia');
CREATE TYPE treatment_type AS ENUM ('LASIK', 'PRK', 'SMILE', 'ICL', 'RLE');
CREATE TYPE eye_side AS ENUM ('Right', 'Left');

-- Pricing Grid Table
-- Each row represents the price for a specific combination of treatment, refractive error, and astigmatism status
CREATE TABLE pricing_grid (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    treatment_type treatment_type NOT NULL,
    refractive_error refractive_error NOT NULL,
    has_astigmatism BOOLEAN NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensure unique combinations
    UNIQUE(treatment_type, refractive_error, has_astigmatism)
);

-- Discounts Table
CREATE TABLE quote_discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    percentage NUMERIC(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add-Ons Table
CREATE TABLE quote_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Financing Settings Table
CREATE TABLE quote_financing_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(50) NOT NULL UNIQUE,
    setting_value NUMERIC(10,4) NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotes Table
CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_name VARCHAR(255) NOT NULL,
    patient_mrn VARCHAR(100) NOT NULL,
    
    -- Right Eye Details
    right_eye_refractive_error refractive_error,
    right_eye_has_astigmatism BOOLEAN,
    right_eye_treatment treatment_type,
    right_eye_price NUMERIC(10,2),
    
    -- Left Eye Details
    left_eye_refractive_error refractive_error,
    left_eye_has_astigmatism BOOLEAN,
    left_eye_treatment treatment_type,
    left_eye_price NUMERIC(10,2),
    
    -- Pricing Details
    subtotal NUMERIC(10,2) NOT NULL,
    bilateral_discount_amount NUMERIC(10,2) DEFAULT 0,
    discount_id UUID REFERENCES quote_discounts(id) ON DELETE SET NULL,
    discount_percentage NUMERIC(5,2) DEFAULT 0,
    discount_amount NUMERIC(10,2) DEFAULT 0,
    addons_total NUMERIC(10,2) DEFAULT 0,
    total_amount NUMERIC(10,2) NOT NULL,
    scheduling_deposit NUMERIC(10,2) NOT NULL,
    balance_due NUMERIC(10,2) NOT NULL,
    
    -- Metadata
    pdf_path TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quote Add-Ons Junction Table (many-to-many)
CREATE TABLE quote_selected_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    addon_id UUID NOT NULL REFERENCES quote_addons(id) ON DELETE CASCADE,
    addon_name VARCHAR(100) NOT NULL, -- Snapshot of name at time of quote
    addon_price NUMERIC(10,2) NOT NULL, -- Snapshot of price at time of quote
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(quote_id, addon_id)
);

-- Indexes for better query performance
CREATE INDEX idx_quotes_patient_name ON quotes(patient_name);
CREATE INDEX idx_quotes_patient_mrn ON quotes(patient_mrn);
CREATE INDEX idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX idx_quotes_created_by ON quotes(created_by);
CREATE INDEX idx_pricing_grid_lookup ON pricing_grid(treatment_type, refractive_error, has_astigmatism) WHERE is_active = true;
CREATE INDEX idx_quote_discounts_active ON quote_discounts(is_active) WHERE is_active = true;
CREATE INDEX idx_quote_addons_active ON quote_addons(is_active) WHERE is_active = true;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_pricing_grid_updated_at
    BEFORE UPDATE ON pricing_grid
    FOR EACH ROW
    EXECUTE FUNCTION update_quotes_updated_at();

CREATE TRIGGER update_quote_discounts_updated_at
    BEFORE UPDATE ON quote_discounts
    FOR EACH ROW
    EXECUTE FUNCTION update_quotes_updated_at();

CREATE TRIGGER update_quote_addons_updated_at
    BEFORE UPDATE ON quote_addons
    FOR EACH ROW
    EXECUTE FUNCTION update_quotes_updated_at();

CREATE TRIGGER update_quotes_updated_at
    BEFORE UPDATE ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION update_quotes_updated_at();

-- RLS Policies
ALTER TABLE pricing_grid ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_financing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_selected_addons ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Authenticated users can view pricing_grid"
    ON pricing_grid FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can manage pricing_grid"
    ON pricing_grid FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can view quote_discounts"
    ON quote_discounts FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can manage quote_discounts"
    ON quote_discounts FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can view quote_addons"
    ON quote_addons FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can manage quote_addons"
    ON quote_addons FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can view quote_financing_settings"
    ON quote_financing_settings FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can manage quote_financing_settings"
    ON quote_financing_settings FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can view quotes"
    ON quotes FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can manage quotes"
    ON quotes FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can view quote_selected_addons"
    ON quote_selected_addons FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can manage quote_selected_addons"
    ON quote_selected_addons FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Service role policies
CREATE POLICY "Service role full access to pricing_grid"
    ON pricing_grid FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to quote_discounts"
    ON quote_discounts FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to quote_addons"
    ON quote_addons FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to quote_financing_settings"
    ON quote_financing_settings FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to quotes"
    ON quotes FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to quote_selected_addons"
    ON quote_selected_addons FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

COMMENT ON TABLE pricing_grid IS 'Base prices for each treatment/refractive error/astigmatism combination';
COMMENT ON TABLE quote_discounts IS 'Configurable discount options (e.g., Military Discount 10%)';
COMMENT ON TABLE quote_addons IS 'Configurable add-on services (e.g., Monovision, Lifetime Enhancements, Workup Charge)';
COMMENT ON TABLE quote_financing_settings IS 'Financing settings like interest rates and bilateral discount percentage';
COMMENT ON TABLE quotes IS 'Patient treatment quotes including bilateral eyes and pricing details';
COMMENT ON TABLE quote_selected_addons IS 'Junction table linking quotes to their selected add-ons';
