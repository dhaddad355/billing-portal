-- =====================================================================
-- MyLEI Portal Schema for Supabase (PostgreSQL)
-- =====================================================================

-- 1. Users table (staff only - populated on Azure AD login)
CREATE TABLE IF NOT EXISTS public.users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  azure_oid      text UNIQUE NOT NULL,           -- Azure AD Object ID
  email          text UNIQUE NOT NULL,
  display_name   text NOT NULL,
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- 2. Persons table (guarantors/patients from NGProd)
CREATE TABLE IF NOT EXISTS public.persons (
  person_id        integer PRIMARY KEY,         -- NGProd.person.person_id (guar_id)
  full_name        text NOT NULL,
  first_name       text,
  last_name        text,
  date_of_birth    date,
  email_address    text,
  cell_phone       text,
  is_patient       boolean NOT NULL DEFAULT true,
  is_guarantor     boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz
);

-- 3. Statements table
CREATE TABLE IF NOT EXISTS public.statements (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id             integer NOT NULL REFERENCES public.persons(person_id),
  statement_date        date NOT NULL,
  account_number_full   text NOT NULL,
  account_number_suffix integer NOT NULL,
  last_statement_date   date,
  next_statement_date   date,
  last_pay_date         date,
  patient_balance       numeric(10,2) NOT NULL,
  currency_code         char(3) NOT NULL DEFAULT 'USD',
  pdf_path              text NOT NULL,            -- storage key in Supabase bucket
  short_code            text UNIQUE,              -- e.g. "QpJ8"
  short_code_created_at timestamptz,
  first_view_at         timestamptz,
  last_view_at          timestamptz,
  view_count            integer NOT NULL DEFAULT 0,
  status                text NOT NULL DEFAULT 'PENDING'
                        CHECK (status IN ('PENDING', 'SENT', 'REJECTED', 'ERROR')),
  created_at            timestamptz NOT NULL DEFAULT now(),
  created_by_user_id    uuid REFERENCES public.users(id),
  sent_at               timestamptz,
  sent_by_user_id       uuid REFERENCES public.users(id),
  rejected_at           timestamptz,
  rejected_by_user_id   uuid REFERENCES public.users(id)
);

CREATE INDEX IF NOT EXISTS idx_statements_status_created ON public.statements (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_statements_person_status ON public.statements (person_id, status);
CREATE INDEX IF NOT EXISTS idx_statements_short_code ON public.statements (short_code) WHERE short_code IS NOT NULL;

-- 4. Messages table (email/SMS logs)
CREATE TABLE IF NOT EXISTS public.messages (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  statement_id         uuid REFERENCES public.statements(id),
  person_id            integer REFERENCES public.persons(person_id),
  channel              text NOT NULL CHECK (channel IN ('EMAIL','SMS')),
  to_address           text NOT NULL,
  subject              text,
  body_preview         text,
  provider             text,
  provider_message_id  text,
  status               text NOT NULL DEFAULT 'QUEUED'
                       CHECK (status IN ('QUEUED','SENT','DELIVERED','FAILED')),
  error_message        text,
  sent_at              timestamptz,
  delivered_at         timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  created_by_user_id   uuid REFERENCES public.users(id)
);

CREATE INDEX IF NOT EXISTS idx_messages_statement ON public.messages (statement_id);

-- 5. Statement Events table (audit trail)
CREATE TABLE IF NOT EXISTS public.statement_events (
  id                  bigserial PRIMARY KEY,
  statement_id        uuid NOT NULL REFERENCES public.statements(id),
  event_type          text NOT NULL,      -- CREATED, STATUS_CHANGE, VIEWED, etc.
  old_status          text,
  new_status          text,
  metadata_json       jsonb,
  created_at          timestamptz NOT NULL DEFAULT now(),
  created_by_user_id  uuid REFERENCES public.users(id)
);

CREATE INDEX IF NOT EXISTS idx_statement_events_statement ON public.statement_events (statement_id, created_at DESC);

-- =====================================================================
-- Row Level Security (RLS) Policies
-- =====================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statement_events ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (used by Next.js API routes)
-- Note: The service role key bypasses RLS by default in Supabase

-- Create policies for authenticated users (if needed in future)
-- For now, all operations go through the service role in API routes

-- =====================================================================
-- Storage Bucket Setup (run via Supabase dashboard or API)
-- =====================================================================
-- CREATE BUCKET: statements
-- Set to private (not public)
-- Access controlled via signed URLs from API routes
