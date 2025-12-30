-- Sample seed data for statements feature with UUID-based person identifiers
INSERT INTO public.persons (person_id, full_name, first_name, last_name, email_address, cell_phone, is_patient, is_guarantor)
VALUES (
  '11111111-2222-3333-4444-555555555555',
  'Sample Patient',
  'Sample',
  'Patient',
  'sample.patient@example.com',
  '+15555550123',
  true,
  true
)
ON CONFLICT (person_id) DO NOTHING;

INSERT INTO public.statements (
  id,
  person_id,
  statement_date,
  account_number_full,
  account_number_suffix,
  patient_balance,
  currency_code,
  pdf_path,
  status,
  created_at
)
VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  '11111111-2222-3333-4444-555555555555',
  '2025-01-15',
  'ACC-001',
  1,
  125.50,
  'USD',
  '11111111-2222-3333-4444-555555555555/2025-01-15/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.pdf',
  'PENDING',
  NOW()
)
ON CONFLICT (id) DO NOTHING;
