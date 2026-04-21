"use server"

import { z } from "zod"
import { getSupabaseServiceClient } from "@/lib/supabase/service"
import { sendEmailVerificationEmail } from "./service"

const emailSchema = z.string().email("Invalid email address")

/**
 * Resend the Postmark verification email for an unconfirmed account.
 * Uses a generic success message when the user is not found to avoid email enumeration.
 */
export async function resendVerificationEmailAction(formEmail: unknown) {
  const parsed = emailSchema.safeParse(typeof formEmail === "string" ? formEmail.trim() : formEmail)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid email address" }
  }

  const emailInput = parsed.data
  const emailLower = emailInput.toLowerCase()
  const supabase = getSupabaseServiceClient()

  const { data: listData, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })

  if (listError) {
    console.error("[resendVerification] listUsers:", listError)
    return { error: "Could not resend email. Try again later." }
  }

  const user = listData?.users?.find((u) => u.email?.toLowerCase() === emailLower)

  if (!user) {
    return {
      success: true as const,
      message: "If an account exists for that email, we sent a verification link.",
    }
  }

  if (user.email_confirmed_at) {
    return { error: "This email is already verified. You can sign in." }
  }

  const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).maybeSingle()

  const canonicalEmail = user.email ?? emailInput

  try {
    await sendEmailVerificationEmail(canonicalEmail, profile?.name ?? null)
  } catch (e) {
    console.error("[resendVerification] sendEmailVerificationEmail:", e)
    return { error: "Could not send email. Try again later." }
  }

  return { success: true as const, message: "Verification email sent. Check your inbox." }
}
