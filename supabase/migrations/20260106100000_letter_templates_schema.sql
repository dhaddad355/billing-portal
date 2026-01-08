-- Migration: Letter Templates Feature Schema
-- Description: Creates tables for letter templates, settings, and generated letters

-- Letter settings table (shared header/footer for all templates)
CREATE TABLE letter_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    header_html TEXT DEFAULT '',
    footer_html TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Letter templates table
CREATE TABLE letter_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated letters table (tracks letters created from templates for referrals)
CREATE TABLE generated_letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
    template_id UUID REFERENCES letter_templates(id) ON DELETE SET NULL,
    template_name VARCHAR(255) NOT NULL,
    merged_html TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    custom_variables JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_letter_templates_is_active ON letter_templates(is_active);
CREATE INDEX idx_letter_templates_name ON letter_templates(name);
CREATE INDEX idx_generated_letters_referral_id ON generated_letters(referral_id);
CREATE INDEX idx_generated_letters_created_at ON generated_letters(created_at);

-- Triggers for updated_at
CREATE TRIGGER update_letter_settings_updated_at
    BEFORE UPDATE ON letter_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_letter_templates_updated_at
    BEFORE UPDATE ON letter_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE letter_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE letter_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_letters ENABLE ROW LEVEL SECURITY;

-- RLS Policies for letter_settings
CREATE POLICY "Authenticated users can view letter_settings"
    ON letter_settings FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert letter_settings"
    ON letter_settings FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update letter_settings"
    ON letter_settings FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Service role full access to letter_settings"
    ON letter_settings FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- RLS Policies for letter_templates
CREATE POLICY "Authenticated users can view letter_templates"
    ON letter_templates FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert letter_templates"
    ON letter_templates FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update letter_templates"
    ON letter_templates FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can delete letter_templates"
    ON letter_templates FOR DELETE
    TO authenticated
    USING (true);

CREATE POLICY "Service role full access to letter_templates"
    ON letter_templates FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- RLS Policies for generated_letters
CREATE POLICY "Authenticated users can view generated_letters"
    ON generated_letters FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert generated_letters"
    ON generated_letters FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can delete generated_letters"
    ON generated_letters FOR DELETE
    TO authenticated
    USING (true);

CREATE POLICY "Service role full access to generated_letters"
    ON generated_letters FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Insert default letter settings row
INSERT INTO letter_settings (id, header_html, footer_html)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '<div style="text-align: center; margin-bottom: 20px;"><h1>MyLEI Eye Institute</h1><p>123 Medical Center Drive, Suite 100<br/>Detroit, MI 48226<br/>Phone: (313) 555-0100 | Fax: (313) 555-0101</p></div>',
    '<div style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;"><p>Thank you for your referral. If you have any questions, please contact us.</p></div>'
);

COMMENT ON TABLE letter_settings IS 'Shared header and footer settings for all letter templates';
COMMENT ON TABLE letter_templates IS 'Configurable letter templates with liquid variable support';
COMMENT ON TABLE generated_letters IS 'Generated letters saved as PDFs for referrals';
COMMENT ON COLUMN letter_templates.body IS 'Letter body content supporting HTML and liquid variables like {{Patient_First_Name}}';
COMMENT ON COLUMN generated_letters.custom_variables IS 'JSON object containing custom variable values provided by user during generation';
