import { getSignupErrorStepForPath, passwordSchema, signupFormSchema } from "@/lib/validations/signup"

const validSignup = {
  profile_type: "individual" as const,
  name: "Ada Lovelace",
  email: "ada@example.com",
  pronouns: null,
  website: null,
  organization_name: null,
  location_place_id: null,
  location_label: null,
  newsletter_ear_opt_in: false,
  newsletter_calendar_opt_in: true,
  referral_source: "google" as const,
  referral_source_other: null,
  self_identifies_emerging: true,
  operating_budget_range: "r_0_24999" as const,
  operating_budget_other_text: null,
  owns_or_operates_venue: "no" as const,
  owns_or_operates_venue_other_text: null,
  supported_by_major_institution: "no" as const,
  supported_by_major_institution_other_text: null,
  classes_hosted_independently: "no" as const,
  classes_hosted_independently_other_text: null,
  has_501c3: "no" as const,
  has_501c3_other_text: null,
  password: "password1",
  confirmPassword: "password1",
  accept_account_terms_and_privacy: true as const,
}

describe("signup legal acceptance validation", () => {
  it("accepts one true value and drops client version and timestamp fields", () => {
    const parsed = signupFormSchema.parse({
      ...validSignup,
      document_version: "client-version",
      accepted_at: "2000-01-01T00:00:00.000Z",
      document_key: "account_terms",
    })

    expect(parsed.accept_account_terms_and_privacy).toBe(true)
    expect(parsed).not.toHaveProperty("document_version")
    expect(parsed).not.toHaveProperty("accepted_at")
    expect(parsed).not.toHaveProperty("document_key")
  })

  it.each([false, undefined, "true", "false", 1])(
    "rejects %p for the registration acceptance",
    (value) => {
      const result = signupFormSchema.safeParse({
        ...validSignup,
        accept_account_terms_and_privacy: value,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(["accept_account_terms_and_privacy"])
        expect(getSignupErrorStepForPath(result.error.issues[0]?.path ?? [])).toBe("password")
      }
    }
  )

  it("rejects a missing acceptance on the password schema", () => {
    const result = passwordSchema.safeParse({
      password: "password1",
      confirmPassword: "password1",
    })

    expect(result.success).toBe(false)
  })
})

describe("signup password confirmation", () => {
  it("rejects an empty confirmPassword on the final schema", () => {
    const result = signupFormSchema.safeParse({
      ...validSignup,
      confirmPassword: "",
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["confirmPassword"],
            message: "Password confirmation is required",
          }),
        ])
      )
    }
  })

  it("rejects a missing confirmPassword on the final schema", () => {
    const { confirmPassword, ...withoutConfirmation } = validSignup
    expect(confirmPassword).toBe("password1")
    expect(withoutConfirmation).not.toHaveProperty("confirmPassword")
    const result = signupFormSchema.safeParse(withoutConfirmation)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === "confirmPassword")).toBe(true)
      expect(getSignupErrorStepForPath(["confirmPassword"])).toBe("password")
    }
  })

  it("rejects a mismatched confirmPassword on the final schema", () => {
    const result = signupFormSchema.safeParse({
      ...validSignup,
      confirmPassword: "different1",
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["confirmPassword"],
            message: "Passwords do not match",
          }),
        ])
      )
    }
  })

  it("accepts a matching confirmPassword on the final schema", () => {
    const result = signupFormSchema.safeParse(validSignup)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.password).toBe("password1")
      expect(result.data.confirmPassword).toBe("password1")
    }
  })

  it("keeps the confirmation rules on the password step schema", () => {
    const empty = passwordSchema.safeParse({
      password: "password1",
      confirmPassword: "",
      accept_account_terms_and_privacy: true,
    })
    const mismatched = passwordSchema.safeParse({
      password: "password1",
      confirmPassword: "different1",
      accept_account_terms_and_privacy: true,
    })

    expect(empty.success).toBe(false)
    expect(mismatched.success).toBe(false)
    if (!mismatched.success) {
      expect(mismatched.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ message: "Passwords do not match" }),
        ])
      )
    }
  })
})
