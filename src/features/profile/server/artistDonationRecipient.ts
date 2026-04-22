import { getSupabaseServerClient } from "@/lib/supabase/server"
import type { FiscalSponsorshipStatus } from "@/lib/types/fiscal-sponsorship"

/**
 * Profile row fields needed to validate `recipient_user_id` on artist-tagged donations via API.
 *
 * **Slug vs user id:** Public donate UI uses slug-based reads (`getProfileBySlugForDonationRepo`) for
 * display only. API routes must validate the canonical recipient by profile id (and optional slug
 * match) so clients cannot spoof recipients.
 *
 * If eligibility moves to another table (e.g. `fiscal_enrollments`), update
 * `getDonationRecipientByUserId` / `isApprovedRecipient` only; keep route call sites stable.
 */
export type ArtistDonationRecipientProfile = {
  id: string
  name: string | null
  slug: string | null
  fiscal_sponsorship_status: FiscalSponsorshipStatus
  profile_type: string | null
  organization_name: string | null
  /** Raw JSON from DB; parse with `parseActiveDonationDesignationConfig`. */
  donation_designation_config: unknown | null
}

/**
 * Loads the profile row needed to validate an artist donation recipient. Single SELECT for API
 * recipient checks — extend this select when donation-related columns are added.
 *
 * @returns `null` if no profile row exists for `userId`.
 * @throws On Supabase/query errors (callers should map to HTTP 500).
 */
export async function getDonationRecipientByUserId(
  userId: string,
): Promise<ArtistDonationRecipientProfile | null> {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, name, slug, fiscal_sponsorship_status, profile_type, organization_name, donation_designation_config",
    )
    .eq("id", userId)
    .maybeSingle()

  if (error) {
    throw error
  }
  if (!data) {
    return null
  }

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    fiscal_sponsorship_status: data.fiscal_sponsorship_status as FiscalSponsorshipStatus,
    profile_type: data.profile_type ?? null,
    organization_name: data.organization_name ?? null,
    donation_designation_config: data.donation_designation_config ?? null,
  }
}

export function isApprovedRecipient(profile: ArtistDonationRecipientProfile): boolean {
  return profile.fiscal_sponsorship_status === "approved"
}
