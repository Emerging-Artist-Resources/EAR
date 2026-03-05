"use server"

import { signupFormSchema } from "@/lib/validations/signup"
import { createProfileRepo, createEligibilitySubmissionRepo } from "./repository-signup"
import { getSupabaseServiceClient } from "@/lib/supabase/service"
import { sendNewProfileAdminEmail, sendEmailVerificationEmail } from "./service"

export async function signupAction(formData: unknown) {
  try {
    const validatedData = signupFormSchema.parse(formData)
    
    const supabase = getSupabaseServiceClient()

    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users.find(u => u.email === validatedData.email)

    if (existingUser) {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", existingUser.id)
        .single()

      if (existingProfile) {
        return { error: "An account with this email already exists. Please sign in instead." }
      }
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: false,
    })

    if (authError || !authData.user) {
      if (authError?.message?.includes("already registered")) {
        return { error: "An account with this email already exists. Please sign in instead." }
      }
      return { error: authError?.message || "Failed to create user account" }
    }

    const userId = authData.user.id

    try {
      const profile = await createProfileRepo(validatedData, userId)
      await createEligibilitySubmissionRepo(validatedData, profile.id)

      try {
        // Ensure name is available - use validatedData as fallback if profile.name is missing
        await sendNewProfileAdminEmail(
          {
            name: profile.name || validatedData.name,
            email: profile.email || validatedData.email,
            profile_type: profile.profile_type || validatedData.profile_type,
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
    } catch (dbError: any) {
      if (dbError?.code === "23505" || dbError?.message?.includes("duplicate key")) {
        await supabase.auth.admin.deleteUser(userId)
        return { error: "An account with this email already exists. Please sign in instead." }
      }
      await supabase.auth.admin.deleteUser(userId)
      return { error: dbError?.message || "Failed to create profile" }
    }
  } catch (error: any) {
    if (error.errors) {
      return { error: "Validation failed: " + error.errors.map((e: any) => e.message).join(", ") }
    }
    return { error: error?.message || "An unexpected error occurred" }
  }
}

