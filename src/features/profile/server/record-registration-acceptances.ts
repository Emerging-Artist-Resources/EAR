import { accountTermsDocument, privacyPolicyDocument } from "@/lib/content/legal"
import { getSupabaseServiceClient } from "@/lib/supabase/service"

export type RegistrationAcceptanceRow = {
  user_id: string
  document_key: "account_terms" | "privacy_policy"
  document_version: string
  listing_id: null
}

/**
 * Two registration rows. Versions come from the published documents.
 * `accepted_at` is omitted so the database trigger stamps it.
 */
export function buildRegistrationAcceptanceRows(userId: string): RegistrationAcceptanceRow[] {
  return [
    {
      user_id: userId,
      document_key: accountTermsDocument.key,
      document_version: accountTermsDocument.version,
      listing_id: null,
    },
    {
      user_id: userId,
      document_key: privacyPolicyDocument.key,
      document_version: privacyPolicyDocument.version,
      listing_id: null,
    },
  ]
}

export async function recordRegistrationAcceptances(userId: string): Promise<void> {
  const rows = buildRegistrationAcceptanceRows(userId)
  const supabase = getSupabaseServiceClient()
  const { error } = await supabase.from("legal_acceptances").insert(rows)
  if (error) throw error
}
