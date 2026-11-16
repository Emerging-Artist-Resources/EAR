-- Name shown after "Support" on /donate/[slug]. Null keeps the organization-then-name fallback.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS donation_page_title text;

COMMENT ON COLUMN public.profiles.donation_page_title IS
  'Name after "Support" on /donate/[slug]; null = organization name for company/festival, otherwise profile name';

-- Match resolveDonationRecipientDisplayName: company/festival use organization_name when set.
-- Trim, then cap at 120 characters (DONATION_PAGE_TITLE_MAX_CHARS) so the prefilled title passes form validation.
UPDATE public.profiles
SET donation_page_title = left(
  CASE
    WHEN profile_type IN ('company', 'festival')
      AND nullif(btrim(organization_name), '') IS NOT NULL
      THEN btrim(organization_name)
    ELSE nullif(btrim(name), '')
  END,
  120
)
WHERE donation_page_title IS NULL;
