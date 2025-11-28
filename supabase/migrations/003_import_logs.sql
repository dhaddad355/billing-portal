-- =====================================================================
-- Import Logs Schema - Track statement import API calls
-- =====================================================================

-- Import logs table to track each API call from the on-premise application
CREATE TABLE IF NOT EXISTS public.import_logs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_number        text NOT NULL,           -- Account number from the statement
  statement_id          uuid REFERENCES public.statements(id),  -- Link to created statement if successful
  person_id             integer REFERENCES public.persons(person_id),  -- Person/guarantor ID
  status                text NOT NULL DEFAULT 'SUCCESS'
                        CHECK (status IN ('SUCCESS', 'FAILED')),
  error_message         text,                    -- Error message if failed
  ip_address            text,                    -- IP address of the caller
  user_agent            text,                    -- User agent of the caller
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- Index for efficient querying by date (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_import_logs_created_at ON public.import_logs (created_at DESC);

-- Index for querying by account number
CREATE INDEX IF NOT EXISTS idx_import_logs_account_number ON public.import_logs (account_number);

-- Enable RLS on import_logs
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;
