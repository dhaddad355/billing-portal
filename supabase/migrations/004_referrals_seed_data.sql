-- Seed Data for Referrals Feature
-- This file populates test data for practices, providers, and referrals

-- Insert test practices
INSERT INTO practices (id, name, address_line1, city, state, zip_code, phone, fax, website, communication_preference, notes) VALUES
('11111111-1111-1111-1111-111111111111', 'Metro Eye Care Associates', '123 Main Street, Suite 100', 'Detroit', 'MI', '48226', '313-555-0100', '313-555-0101', 'www.metroeyecare.com', 'Fax', 'Large practice with multiple locations'),
('22222222-2222-2222-2222-222222222222', 'Oakland Vision Center', '456 Telegraph Road', 'Pontiac', 'MI', '48341', '248-555-0200', '248-555-0201', 'www.oaklandvision.com', 'Email', 'Preferred partner practice'),
('33333333-3333-3333-3333-333333333333', 'Lakeside Optometry', '789 Lake Shore Drive', 'St. Clair Shores', 'MI', '48080', '586-555-0300', '586-555-0301', NULL, 'Fax', NULL),
('44444444-4444-4444-4444-444444444444', 'University Eye Institute', '1000 Medical Center Dr', 'Ann Arbor', 'MI', '48109', '734-555-0400', '734-555-0401', 'www.umich.edu/eye', 'Email', 'Academic medical center'),
('55555555-5555-5555-5555-555555555555', 'Northville Family Eye Care', '200 N Center Street', 'Northville', 'MI', '48167', '248-555-0500', '248-555-0501', 'www.northvilleeye.com', 'Fax', 'Family-oriented practice');

-- Insert test providers
INSERT INTO providers (id, practice_id, first_name, last_name, degree, email, phone, notes) VALUES
('aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'James', 'Wilson', 'MD', 'jwilson@metroeyecare.com', '313-555-0102', 'Specializes in corneal conditions'),
('aaaa2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Sarah', 'Chen', 'OD', 'schen@metroeyecare.com', '313-555-0103', NULL),
('bbbb1111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Michael', 'Rodriguez', 'MD', 'mrodriguez@oaklandvision.com', '248-555-0202', 'High-volume referrer'),
('bbbb2222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Emily', 'Johnson', 'OD', 'ejohnson@oaklandvision.com', '248-555-0203', NULL),
('cccc1111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'David', 'Kim', 'OD', 'dkim@lakesideoptometry.com', '586-555-0302', NULL),
('dddd1111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'Patricia', 'Martinez', 'MD', 'pmartinez@umich.edu', '734-555-0402', 'Academic referrals, complex cases'),
('dddd2222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'Robert', 'Thompson', 'MD', 'rthompson@umich.edu', '734-555-0403', 'Retina specialist'),
('eeee1111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'Jennifer', 'Davis', 'OD', 'jdavis@northvilleeye.com', '248-555-0502', 'Primary care optometry');

-- Insert test referrals (assuming a test user exists with id from users table)
-- Note: created_by will need to be updated to match actual user IDs in your system
INSERT INTO referrals (
    id, provider_id, practice_id, 
    patient_full_name, patient_dob, patient_phone, patient_email,
    referral_reason, referral_reason_other, notes, scheduling_preference,
    communication_preference, communication_value,
    status, sub_status, created_at
) VALUES
-- Open referrals in various sub-statuses
('ref11111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
 'John Smith', '1985-03-15', '313-555-1001', 'jsmith@email.com',
 'Laser Vision Correction', NULL, 'Patient interested in LASIK, wears contacts', 'Call Patient',
 'Fax', '313-555-0101',
 'OPEN', 'Scheduling', NOW() - INTERVAL '2 days'),

('ref22222-2222-2222-2222-222222222222', 'bbbb1111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
 'Maria Garcia', '1972-08-22', '248-555-2002', 'mgarcia@email.com',
 'Cataract Consultation', NULL, 'Bilateral cataracts, affecting daily activities', 'Email Patient',
 'Email', 'mrodriguez@oaklandvision.com',
 'OPEN', 'Appointment', NOW() - INTERVAL '5 days'),

('ref33333-3333-3333-3333-333333333333', 'cccc1111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333',
 'Robert Johnson', '1990-01-10', '586-555-3003', 'rjohnson@email.com',
 'Laser Vision Correction', NULL, 'High myopia, stable prescription for 2 years', 'SMS Patient',
 'Fax', '586-555-0301',
 'OPEN', 'Quote', NOW() - INTERVAL '7 days'),

('ref44444-4444-4444-4444-444444444444', 'dddd1111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444',
 'Susan Williams', '1968-11-30', '734-555-4004', 'swilliams@email.com',
 'Cataract Consultation', NULL, 'Complex case, previous corneal surgery', 'Patient Instructed To Call',
 'Email', 'pmartinez@umich.edu',
 'OPEN', 'Procedure', NOW() - INTERVAL '14 days'),

('ref55555-5555-5555-5555-555555555555', 'eeee1111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555',
 'Michael Brown', '1982-06-05', '248-555-5005', 'mbrown@email.com',
 'Other', 'Pterygium evaluation', 'Growing pterygium affecting vision', 'Call Patient',
 'Fax', '248-555-0501',
 'OPEN', 'Scheduling', NOW() - INTERVAL '1 day'),

-- Closed referrals
('ref66666-6666-6666-6666-666666666666', 'aaaa2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
 'Linda Davis', '1975-04-18', '313-555-6006', 'ldavis@email.com',
 'Laser Vision Correction', NULL, 'Successfully completed LASIK procedure', 'Call Patient',
 'Fax', '313-555-0101',
 'CLOSED', 'Post-Op', NOW() - INTERVAL '30 days'),

('ref77777-7777-7777-7777-777777777777', 'bbbb2222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
 'Thomas Wilson', '1965-09-25', '248-555-7007', 'twilson@email.com',
 'Cataract Consultation', NULL, 'Completed bilateral cataract surgery', 'Email Patient',
 'Email', 'ejohnson@oaklandvision.com',
 'CLOSED', 'Post-Op', NOW() - INTERVAL '45 days');

-- Insert test referral notes
INSERT INTO referral_notes (referral_id, note, note_type, previous_sub_status, new_sub_status, created_at) VALUES
-- Notes for ref22222 (Maria Garcia)
('ref22222-2222-2222-2222-222222222222', 'Initial contact made with patient. Appointment scheduled for next week.', 'manual', NULL, NULL, NOW() - INTERVAL '4 days'),
('ref22222-2222-2222-2222-222222222222', 'Status updated from Scheduling to Appointment', 'status_change', 'Scheduling', 'Appointment', NOW() - INTERVAL '3 days'),

-- Notes for ref33333 (Robert Johnson)
('ref33333-3333-3333-3333-333333333333', 'Patient came in for consultation. Good candidate for LASIK.', 'manual', NULL, NULL, NOW() - INTERVAL '6 days'),
('ref33333-3333-3333-3333-333333333333', 'Status updated from Scheduling to Appointment', 'status_change', 'Scheduling', 'Appointment', NOW() - INTERVAL '6 days'),
('ref33333-3333-3333-3333-333333333333', 'Quote provided to patient. Reviewing financing options.', 'manual', NULL, NULL, NOW() - INTERVAL '5 days'),
('ref33333-3333-3333-3333-333333333333', 'Status updated from Appointment to Quote', 'status_change', 'Appointment', 'Quote', NOW() - INTERVAL '5 days'),

-- Notes for ref44444 (Susan Williams)
('ref44444-4444-4444-4444-444444444444', 'Complex case reviewed by surgical team. Approved for surgery.', 'manual', NULL, NULL, NOW() - INTERVAL '10 days'),
('ref44444-4444-4444-4444-444444444444', 'Surgery scheduled for next Monday.', 'manual', NULL, NULL, NOW() - INTERVAL '7 days'),
('ref44444-4444-4444-4444-444444444444', 'Status updated to Procedure', 'status_change', 'Quote', 'Procedure', NOW() - INTERVAL '7 days'),

-- Notes for closed referral ref66666 (Linda Davis)
('ref66666-6666-6666-6666-666666666666', 'Patient completed LASIK procedure successfully.', 'manual', NULL, NULL, NOW() - INTERVAL '25 days'),
('ref66666-6666-6666-6666-666666666666', 'Post-op day 1: Vision 20/20, no complications.', 'manual', NULL, NULL, NOW() - INTERVAL '24 days'),
('ref66666-6666-6666-6666-666666666666', 'Post-op week 1: Excellent healing, patient very satisfied.', 'manual', NULL, NULL, NOW() - INTERVAL '18 days'),
('ref66666-6666-6666-6666-666666666666', 'Final follow-up complete. Referral closed.', 'manual', NULL, NULL, NOW() - INTERVAL '10 days');
