-- =====================================================================
-- Settings Table for SMS/Email Configuration
-- =====================================================================

-- Settings table to store configuration values
CREATE TABLE IF NOT EXISTS public.settings (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key            text UNIQUE NOT NULL,
  value          text,
  description    text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on settings table
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Insert default settings
INSERT INTO public.settings (key, value, description) VALUES
  ('sms_message_template', 'Hi {{first_name}}, your statement of {{amount_due}} is ready. View and pay here: {{link}}', 'SMS message template with handlebars variables'),
  ('email_subject_template', 'Your Statement from Laser Eye Institute - {{amount_due}} Due', 'Email subject line template'),
  ('email_html_template', '<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #2563eb;">Laser Eye Institute</h2><p>Dear {{first_name}},</p><p>Your statement is ready for review. The balance due is <strong>{{amount_due}}</strong>.</p><p><a href="{{link}}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">View & Pay Statement</a></p><p>Or copy and paste this link into your browser:</p><p style="color: #6b7280;">{{link}}</p><hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" /><p style="color: #6b7280; font-size: 12px;">This is an automated message from Laser Eye Institute. Please do not reply directly to this email.</p></body></html>', 'Email HTML body template'),
  ('email_text_template', 'Dear {{first_name}},\n\nYour statement is ready for review. The balance due is {{amount_due}}.\n\nView and pay your statement here: {{link}}\n\nThis is an automated message from Laser Eye Institute.', 'Email plain text body template'),
  ('postmark_template_id', '', 'Postmark template ID if using Postmark templates')
ON CONFLICT (key) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_settings_key ON public.settings (key);
