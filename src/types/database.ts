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
