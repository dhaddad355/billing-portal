export interface Person {
  person_id: number;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  email_address: string | null;
  cell_phone: string | null;
  is_patient: boolean;
  is_guarantor: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface Statement {
  id: string;
  person_id: number;
  statement_date: string;
  account_number_full: string;
  account_number_suffix: number;
  last_statement_date: string | null;
  next_statement_date: string | null;
  last_pay_date: string | null;
  patient_balance: number;
  currency_code: string;
  pdf_path: string;
  short_code: string | null;
  short_code_created_at: string | null;
  first_view_at: string | null;
  last_view_at: string | null;
  view_count: number;
  status: "PENDING" | "SENT" | "REJECTED" | "ERROR";
  created_at: string;
  created_by_user_id: string | null;
  sent_at: string | null;
  sent_by_user_id: string | null;
  rejected_at: string | null;
  rejected_by_user_id: string | null;
}

export interface StatementWithPerson extends Statement {
  persons: Person;
}

export interface User {
  id: string;
  azure_oid: string;
  email: string;
  display_name: string;
  is_active: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  statement_id: string | null;
  person_id: number | null;
  channel: "EMAIL" | "SMS";
  to_address: string;
  subject: string | null;
  body_preview: string | null;
  provider: string | null;
  provider_message_id: string | null;
  status: "QUEUED" | "SENT" | "DELIVERED" | "FAILED";
  error_message: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  created_at: string;
  created_by_user_id: string | null;
}

export interface StatementEvent {
  id: number;
  statement_id: string;
  event_type: string;
  old_status: string | null;
  new_status: string | null;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
  created_by_user_id: string | null;
}

// Referrals Feature Types

export type ReferralStatus = "OPEN" | "CLOSED";
export type ReferralSubStatus = "Scheduling" | "Appointment" | "Quote" | "Procedure" | "Post-Op";
export type CommunicationPreference = "Email" | "Fax";
export type ReferralReason = "Laser Vision Correction" | "Cataract Consultation" | "Other";
export type SchedulingPreference = "Call Patient" | "SMS Patient" | "Email Patient" | "Patient Instructed To Call";

export interface Practice {
  id: string;
  name: string;
  address_line1: string | null;
  address_line2: string | null;
  address?: string | null; // TODO: Computed field or add to DB
  city: string | null;
  state: string | null;
  zip_code: string | null;
  zip?: string | null; // Alias for zip_code
  phone: string | null;
  fax: string | null;
  website: string | null;
  communication_preference: CommunicationPreference;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Provider {
  id: string;
  practice_id: string | null;
  first_name: string;
  last_name: string;
  degree: string | null;
  specialty?: string | null; // TODO: Add to database migration
  npi?: string | null; // TODO: Add to database migration
  email: string | null;
  phone: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProviderWithPractice extends Provider {
  practices: Practice | null;
}

export type Priority = "low" | "normal" | "high" | "urgent";

export interface Referral {
  id: string;
  provider_id: string | null;
  practice_id: string | null;
  patient_full_name: string;
  patient_first_name?: string | null; // TODO: Derived from patient_full_name or add to DB
  patient_last_name?: string | null; // TODO: Derived from patient_full_name or add to DB
  patient_dob: string;
  patient_phone: string | null;
  patient_email: string | null;
  referral_reason: ReferralReason;
  referral_reason_other: string | null;
  notes: string | null;
  scheduling_preference: SchedulingPreference;
  communication_preference: CommunicationPreference;
  communication_value: string | null;
  status: ReferralStatus;
  sub_status: ReferralSubStatus;
  open_status?: ReferralStatus; // Alias for status
  priority?: Priority | null; // TODO: Add to database migration
  procedure_type?: string | null; // TODO: Add to database migration
  procedure_location?: string | null; // TODO: Add to database migration
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReferralWithRelations extends Referral {
  providers: ProviderWithPractice | null;
  practices: Practice | null;
}

export interface ReferralNote {
  id: string;
  referral_id: string;
  user_id: string | null;
  note: string;
  note_type: "manual" | "status_change" | "system";
  previous_status: ReferralStatus | null;
  new_status: ReferralStatus | null;
  previous_sub_status: ReferralSubStatus | null;
  new_sub_status: ReferralSubStatus | null;
  created_at: string;
}

export interface ReferralNoteWithUser extends ReferralNote {
  users: User | null;
}

// Quotes Feature Types

export type RefractiveError = "Myopia" | "Hyperopia" | "Presbyopia";
export type TreatmentType = "LASIK" | "PRK" | "SMILE" | "ICL" | "RLE";
export type EyeSide = "Right" | "Left";

export interface PricingGridItem {
  id: string;
  treatment_type: TreatmentType;
  refractive_error: RefractiveError;
  has_astigmatism: boolean;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuoteDiscount {
  id: string;
  name: string;
  percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuoteAddon {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuoteFinancingSetting {
  id: string;
  setting_key: string;
  setting_value: number;
  description: string | null;
  updated_at: string;
}

export interface Quote {
  id: string;
  patient_name: string;
  patient_mrn: string;
  
  // Right Eye
  right_eye_refractive_error: RefractiveError | null;
  right_eye_has_astigmatism: boolean | null;
  right_eye_treatment: TreatmentType | null;
  right_eye_price: number | null;
  
  // Left Eye
  left_eye_refractive_error: RefractiveError | null;
  left_eye_has_astigmatism: boolean | null;
  left_eye_treatment: TreatmentType | null;
  left_eye_price: number | null;
  
  // Pricing
  subtotal: number;
  bilateral_discount_amount: number;
  discount_id: string | null;
  discount_percentage: number;
  discount_amount: number;
  addons_total: number;
  total_amount: number;
  scheduling_deposit: number;
  balance_due: number;
  
  // Metadata
  pdf_path: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuoteSelectedAddon {
  id: string;
  quote_id: string;
  addon_id: string;
  addon_name: string;
  addon_price: number;
  created_at: string;
}

export interface QuoteWithRelations extends Quote {
  quote_discounts: QuoteDiscount | null;
  quote_selected_addons: QuoteSelectedAddon[];
  users: User | null;
}

export interface QuoteSettings {
  pricing_grid: PricingGridItem[];
  discounts: QuoteDiscount[];
  addons: QuoteAddon[];
  financing_settings: Record<string, number>;
}
