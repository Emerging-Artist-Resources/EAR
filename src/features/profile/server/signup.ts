"use server"

import { z } from "zod"
import { signupFormSchema, getSignupErrorStepForPath, type SignupErrorStep } from "@/lib/validations/signup"
import { createProfileRepo, createEligibilitySubmissionRepo } from "./repository-signup"
import { getSupabaseServiceClient } from "@/lib/supabase/service"
import { sendNewProfileAdminEmail, sendEmailVerificationEmail } from "./service"
import { syncNewsletterPreferences } from "@/features/newsletter/server/syncNewsletterPreferences"

export type SignupActionResult =
  | { success: true }
  | {
      error: string
      code?: "ACCOUNT_EXISTS"
      step?: SignupErrorStep
    }

const ACCOUNT_EXISTS_MESSAGE = "An account with this email already exists. Please sign in instead."

export async function signupAction(formData: unknown): Promise<SignupActionResult> {
  try {
    const validatedData = signupFormSchema.parse(formData)

    const supabase = getSupabaseServiceClient()

    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users.find((u) => u.email === validatedData.email)

    if (existingUser) {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", existingUser.id)
        .single()

      if (existingProfile) {
        return { error: ACCOUNT_EXISTS_MESSAGE, code: "ACCOUNT_EXISTS" }
      }
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: false,
    })

    if (authError || !authData.user) {
      if (authError?.message?.includes("already registered")) {
        return { error: ACCOUNT_EXISTS_MESSAGE, code: "ACCOUNT_EXISTS" }
      }
      return { error: authError?.message || "Failed to create user account" }
    }

    const userId = authData.user.id

    try {
      const profile = await createProfileRepo(validatedData, userId)
      await createEligibilitySubmissionRepo(validatedData, profile.id)

      try {
        await syncNewsletterPreferences({
          email: validatedData.email,
          earOptIn: validatedData.newsletter_ear_opt_in,
          calendarOptIn: validatedData.newsletter_calendar_opt_in,
          profileId: userId,
          source: "signup",
        })
      } catch (newsletterErr) {
        console.error("[newsletter] signup sync failed", newsletterErr)
      }

      try {
        await sendNewProfileAdminEmail(
          {
            name: validatedData.name,
            email: validatedData.email,
            profile_type: validatedData.profile_type,
            organization_name: validatedData.organization_name ?? null,
          },
          userId
        )
      } catch (emailError) {
        console.error("[EMAIL] Failed to send admin notification email:", emailError)
      }

      try {
        await sendEmailVerificationEmail(validatedData.email, validatedData.name)
      } catch (emailError) {
        console.error("[EMAIL] Failed to send email verification email:", emailError)
      }

      return { success: true }
    } catch (dbError: unknown) {
      const dbe = dbError as { code?: string; message?: string }
      if (dbe?.code === "23505" || dbe?.message?.includes("duplicate key")) {
        await supabase.auth.admin.deleteUser(userId)
        return { error: ACCOUNT_EXISTS_MESSAGE, code: "ACCOUNT_EXISTS" }
      }
      await supabase.auth.admin.deleteUser(userId)
      return { error: dbe?.message || "Failed to create profile" }
    }
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const first = error.issues[0]
      const step = getSignupErrorStepForPath(first?.path ?? [])
      const msg = first?.message ?? "Validation failed"
      return { error: msg, step }
    }
    const err = error as { errors?: { message: string }[] }
    if (err.errors) {
      return { error: "Validation failed: " + err.errors.map((e) => e.message).join(", ") }
    }
    const e = error as { message?: string }
    return { error: e?.message || "An unexpected error occurred" }
  }
}
