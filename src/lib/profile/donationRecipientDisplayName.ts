/**
 * Name shown after "Support" on public donation pages.
 * A saved donation page title wins. Otherwise company/festival profiles use
 * organization_name when set, and everyone else uses the profile name.
 */
export function resolveDonationRecipientDisplayName(input: {
  name: string | null
  organization_name: string | null
  profile_type: string | null
  /** Stored customize-page title. Blank or omitted falls through to the default rule. */
  donation_page_title?: string | null
}): string | null {
  const title = input.donation_page_title?.trim()
  if (title) return title

  const pt = input.profile_type
  if (pt === "company" || pt === "festival") {
    const org = input.organization_name?.trim()
    if (org) return org
  }
  const n = input.name?.trim()
  return n || null
}
