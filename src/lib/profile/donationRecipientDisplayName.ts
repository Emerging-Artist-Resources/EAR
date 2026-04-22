/**
 * Public donation pages should show the fiscal entity name for company/festival
 * profiles (organization) when set, not only the individual contact name.
 */
export function resolveDonationRecipientDisplayName(input: {
  name: string | null
  organization_name: string | null
  profile_type: string | null
}): string | null {
  const pt = input.profile_type
  if (pt === "company" || pt === "festival") {
    const org = input.organization_name?.trim()
    if (org) return org
  }
  const n = input.name?.trim()
  return n || null
}
