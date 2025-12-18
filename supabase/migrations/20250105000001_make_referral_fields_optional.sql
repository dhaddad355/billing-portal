-- Migration: Make referral fields optional except patient names
-- Description: Only patient_full_name (first + last name) should be required

-- Make patient_dob optional
ALTER TABLE referrals
  ALTER COLUMN patient_dob DROP NOT NULL;

-- Make referral_reason optional
ALTER TABLE referrals
  ALTER COLUMN referral_reason DROP NOT NULL;

-- Make scheduling_preference optional
ALTER TABLE referrals
  ALTER COLUMN scheduling_preference DROP NOT NULL;

-- Make communication_preference optional
ALTER TABLE referrals
  ALTER COLUMN communication_preference DROP NOT NULL;

-- patient_full_name remains NOT NULL (this is the only required field)
