-- Seed Data for Quotes Feature

-- =====================================================================
-- 1. Pricing Grid Seed Data
-- =====================================================================
-- Base prices for different treatment/refractive error/astigmatism combinations
-- These are example prices and should be adjusted based on actual pricing

-- LASIK Pricing
INSERT INTO pricing_grid (treatment_type, refractive_error, has_astigmatism, price) VALUES
('LASIK', 'Myopia', false, 2500.00),
('LASIK', 'Myopia', true, 2750.00),
('LASIK', 'Hyperopia', false, 2500.00),
('LASIK', 'Hyperopia', true, 2750.00),
('LASIK', 'Presbyopia', false, 2800.00),
('LASIK', 'Presbyopia', true, 3000.00);

-- PRK Pricing
INSERT INTO pricing_grid (treatment_type, refractive_error, has_astigmatism, price) VALUES
('PRK', 'Myopia', false, 2300.00),
('PRK', 'Myopia', true, 2550.00),
('PRK', 'Hyperopia', false, 2300.00),
('PRK', 'Hyperopia', true, 2550.00),
('PRK', 'Presbyopia', false, 2600.00),
('PRK', 'Presbyopia', true, 2800.00);

-- SMILE Pricing
INSERT INTO pricing_grid (treatment_type, refractive_error, has_astigmatism, price) VALUES
('SMILE', 'Myopia', false, 3000.00),
('SMILE', 'Myopia', true, 3250.00),
('SMILE', 'Hyperopia', false, 3000.00),
('SMILE', 'Hyperopia', true, 3250.00),
('SMILE', 'Presbyopia', false, 3300.00),
('SMILE', 'Presbyopia', true, 3500.00);

-- ICL Pricing
INSERT INTO pricing_grid (treatment_type, refractive_error, has_astigmatism, price) VALUES
('ICL', 'Myopia', false, 4500.00),
('ICL', 'Myopia', true, 4750.00),
('ICL', 'Hyperopia', false, 4500.00),
('ICL', 'Hyperopia', true, 4750.00),
('ICL', 'Presbyopia', false, 4800.00),
('ICL', 'Presbyopia', true, 5000.00);

-- RLE Pricing
INSERT INTO pricing_grid (treatment_type, refractive_error, has_astigmatism, price) VALUES
('RLE', 'Myopia', false, 5000.00),
('RLE', 'Myopia', true, 5250.00),
('RLE', 'Hyperopia', false, 5000.00),
('RLE', 'Hyperopia', true, 5250.00),
('RLE', 'Presbyopia', false, 5300.00),
('RLE', 'Presbyopia', true, 5500.00);

-- =====================================================================
-- 2. Discounts Seed Data
-- =====================================================================
INSERT INTO quote_discounts (name, percentage) VALUES
('Military Discount', 10.00),
('Healthcare Worker Discount', 10.00),
('Teacher Discount', 10.00),
('Senior Discount (65+)', 5.00),
('First Responder Discount', 10.00),
('Family & Friends', 15.00),
('Seasonal Promotion', 20.00);

-- =====================================================================
-- 3. Add-Ons Seed Data
-- =====================================================================
INSERT INTO quote_addons (name, price) VALUES
('Monovision', 0.00),
('Lifetime Enhancements', 500.00),
('Workup Charge', 250.00);

-- =====================================================================
-- 4. Financing Settings Seed Data
-- =====================================================================
-- Interest rates and other financing configuration
INSERT INTO quote_financing_settings (setting_key, setting_value, description) VALUES
('interest_rate_36_month', 12.99, 'Annual interest rate for 36-month financing (as percentage)'),
('interest_rate_60_month', 15.99, 'Annual interest rate for 60-month financing (as percentage)'),
('bilateral_discount_percentage', 10.00, 'Percentage discount when treating both eyes (as percentage)'),
('scheduling_deposit_percentage', 20.00, 'Percentage of total to collect as scheduling deposit (as percentage)');

-- =====================================================================
-- Notes:
-- =====================================================================
-- 1. Prices are in USD and are examples. Update with actual pricing.
-- 2. Bilateral discount is applied automatically when both eyes are treated.
-- 3. Interest rates are annual rates. Monthly rates will be calculated in the application.
-- 4. The scheduling deposit is typically 20% of the total amount.
-- 5. All settings can be modified through the Settings UI.
