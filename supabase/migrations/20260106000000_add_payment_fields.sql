-- =====================================================================
-- Add Payment Fields to Statements Table
-- For tracking Gravity Forms payment webhook data
-- =====================================================================

-- Add payment tracking columns to statements table
ALTER TABLE public.statements
  ADD COLUMN IF NOT EXISTS payment_status text,
  ADD COLUMN IF NOT EXISTS payment_amount numeric(10,2),
  ADD COLUMN IF NOT EXISTS payment_date timestamptz,
  ADD COLUMN IF NOT EXISTS payment_transaction_id text,
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS payment_gateway_entry_id text;

-- Add index for looking up statements by account number (used by webhook)
CREATE INDEX IF NOT EXISTS idx_statements_account_number
  ON public.statements (account_number_full);

-- Add index for payment status queries
CREATE INDEX IF NOT EXISTS idx_statements_payment_status
  ON public.statements (payment_status)
  WHERE payment_status IS NOT NULL;

COMMENT ON COLUMN public.statements.payment_status IS 'Payment status from Gravity Forms (e.g., Paid, Failed, Pending)';
COMMENT ON COLUMN public.statements.payment_amount IS 'Payment amount received';
COMMENT ON COLUMN public.statements.payment_date IS 'Date/time payment was processed';
COMMENT ON COLUMN public.statements.payment_transaction_id IS 'Transaction ID from payment processor';
COMMENT ON COLUMN public.statements.payment_method IS 'Payment method used (e.g., Credit Card)';
COMMENT ON COLUMN public.statements.payment_gateway_entry_id IS 'Gravity Forms entry ID';
