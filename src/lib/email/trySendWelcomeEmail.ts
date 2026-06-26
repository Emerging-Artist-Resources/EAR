import { getSupabaseServiceClient } from "@/lib/supabase/service"
import { postmarkClient } from "@/lib/email/postmark"
import { sendProfileEmail } from "@/lib/email/sendProfileEmail"
import { greetingNameFromFullName } from "@/lib/names/person-name"

export type TrySendWelcomeEmailResult =
  | { sent: true }
  | { sent: false; reason: "disabled" | "not_configured" | "not_confirmed" | "already_sent" | "no_email" }

export async function trySendWelcomeEmail({
  userId,
}: {
  userId: string
}): Promise<TrySendWelcomeEmailResult> {
  if (process.env.DISABLE_EMAILS === "true") {
    console.log(`[welcome-email userId=${userId}] Skipped (DISABLE_EMAILS)`)
    return { sent: false, reason: "disabled" }
  }

  if (
    !postmarkClient ||
    !process.env.POSTMARK_FROM_NAME?.trim() ||
    !process.env.POSTMARK_FROM_EMAIL?.trim()
  ) {
    console.warn(`[welcome-email userId=${userId}] Skipped: Postmark not configured`)
    return { sent: false, reason: "not_configured" }
  }

  const supabase = getSupabaseServiceClient()

  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
  if (authError || !authUser?.user) {
    console.error(`[welcome-email userId=${userId}] Failed to load auth user`, { error: authError })
    return { sent: false, reason: "not_confirmed" }
  }

  if (!authUser.user.email_confirmed_at) {
    return { sent: false, reason: "not_confirmed" }
  }

  const isoNow = new Date().toISOString()
  const { data: claimedRows, error: claimError } = await supabase
    .from("profiles")
    .update({ welcome_email_sent_at: isoNow })
    .eq("id", userId)
    .is("welcome_email_sent_at", null)
    .select("id, name, email")

  if (claimError) {
    console.error(`[welcome-email userId=${userId}] Claim failed`, { error: claimError })
    throw claimError
  }

  if (!claimedRows?.length) {
    return { sent: false, reason: "already_sent" }
  }

  const profile = claimedRows[0]
  const to = profile.email?.trim()
  if (!to) {
    console.warn(`[welcome-email userId=${userId}] Profile has no email`)
    return { sent: false, reason: "no_email" }
  }

  const firstName = greetingNameFromFullName(profile.name)

  try {
    await sendProfileEmail("welcome-email", { to, firstName })
    return { sent: true }
  } catch (error) {
    console.error(`[welcome-email userId=${userId}] Postmark send failed`, error)
    throw error
  }
}
