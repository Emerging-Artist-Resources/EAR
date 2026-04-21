"use server"

import { z } from "zod"
import { getSupabaseServiceClient } from "@/lib/supabase/service"
import { sendPasswordResetEmail } from "./service"

const emailSchema = z.string().email("Invalid email address")
const GENERIC_SUCCESS_MESSAGE =
  "If an account exists for that email, we sent a password reset link."

/**
 * Generates Supabase recovery links server-side and sends via Postmark.
 * Returns a generic success response to avoid email enumeration.
 */
export async function requestPasswordResetAction(formEmail: unknown) {
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
    console.error("[passwordReset] listUsers:", listError)
    return { success: true as const, message: GENERIC_SUCCESS_MESSAGE }
  }

  const user = listData?.users?.find((u) => u.email?.toLowerCase() === emailLower)
  if (!user?.email) {
    return { success: true as const, message: GENERIC_SUCCESS_MESSAGE }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .maybeSingle()

  try {
    await sendPasswordResetEmail(user.email, profile?.name ?? null)
  } catch (error) {
    console.error("[passwordReset] sendPasswordResetEmail:", error)
  }

  return { success: true as const, message: GENERIC_SUCCESS_MESSAGE }
}
