-- Idempotency marker for post-verification welcome email (Postmark welcome-email template)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS welcome_email_sent_at timestamptz;

COMMENT ON COLUMN public.profiles.welcome_email_sent_at IS
  'When the welcome-email Postmark template was claimed/sent; null if not sent';

-- Existing verified users should not receive a retroactive welcome email
UPDATE public.profiles p
SET welcome_email_sent_at = now()
FROM auth.users u
WHERE u.id = p.id
  AND u.email_confirmed_at IS NOT NULL
  AND p.welcome_email_sent_at IS NULL;
