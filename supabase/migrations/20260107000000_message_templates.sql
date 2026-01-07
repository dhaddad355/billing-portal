-- =====================================================================
-- Message Templates Table for Customizable SMS/Email Messages
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type text NOT NULL CHECK (template_type IN ('initial', 'reminder')),
  channel text NOT NULL CHECK (channel IN ('sms', 'email')),

  -- Email-specific fields
  email_subject text,

  -- Message content (plain text for SMS, HTML for email)
  message_body text NOT NULL,

  -- Metadata
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by_user_id uuid REFERENCES public.users(id),

  -- Ensure unique template per type/channel combination
  UNIQUE(template_type, channel)
);

-- Enable RLS
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- Insert default templates
INSERT INTO public.message_templates (template_type, channel, email_subject, message_body) VALUES
  -- Initial SMS
  ('initial', 'sms', NULL, 'Laser Eye Institute: Your statement is ready. View & pay: {{view_url}}'),

  -- Initial Email
  ('initial', 'email', 'Your statement from Laser Eye Institute', '<html>
  <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #2563eb;">Laser Eye Institute</h2>
    <p>Dear {{patient_name}},</p>
    <p>Your statement is ready for review. The balance due is <strong>{{balance_amount}}</strong>.</p>
    <p>
      <a href="{{view_url}}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
        View & Pay Statement
      </a>
    </p>
    <p>Or copy and paste this link into your browser:</p>
    <p style="color: #6b7280;">{{view_url}}</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
    <p style="color: #6b7280; font-size: 12px;">
      This is an automated message from Laser Eye Institute.
      Please do not reply directly to this email.
    </p>
  </body>
</html>'),

  -- Reminder SMS
  ('reminder', 'sms', NULL, 'Laser Eye Institute Reminder: You have an outstanding balance of {{balance_amount}}. View & pay: {{view_url}}'),

  -- Reminder Email
  ('reminder', 'email', 'Reminder: Outstanding balance from Laser Eye Institute', '<html>
  <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #2563eb;">Laser Eye Institute</h2>
    <p>Dear {{patient_name}},</p>
    <p><strong>This is a friendly reminder</strong> that you have an outstanding balance of <strong>{{balance_amount}}</strong>.</p>
    <p>Please take a moment to review and pay your statement at your earliest convenience.</p>
    <p>
      <a href="{{view_url}}" style="display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
        Pay Now
      </a>
    </p>
    <p>Or copy and paste this link into your browser:</p>
    <p style="color: #6b7280;">{{view_url}}</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
    <p style="color: #6b7280; font-size: 12px;">
      This is an automated reminder from Laser Eye Institute.
      If you have already made a payment, please disregard this message.
    </p>
  </body>
</html>')
ON CONFLICT (template_type, channel) DO NOTHING;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_message_templates_type_channel
  ON public.message_templates (template_type, channel);

COMMENT ON TABLE public.message_templates IS 'Stores customizable message templates for SMS and email communications';
COMMENT ON COLUMN public.message_templates.template_type IS 'Type of message: initial (first send) or reminder';
COMMENT ON COLUMN public.message_templates.channel IS 'Communication channel: sms or email';
COMMENT ON COLUMN public.message_templates.message_body IS 'Template content with placeholders: {{patient_name}}, {{balance_amount}}, {{view_url}}';
