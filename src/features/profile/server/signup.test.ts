const mockListUsers = jest.fn()
const mockCreateUser = jest.fn()
const mockDeleteUser = jest.fn()
const mockInsert = jest.fn()
const mockCreateProfileRepo = jest.fn()
const mockCreateEligibilitySubmissionRepo = jest.fn()

jest.mock("@/lib/supabase/service", () => ({
  getSupabaseServiceClient: () => ({
    auth: {
      admin: {
        listUsers: mockListUsers,
        createUser: mockCreateUser,
        deleteUser: mockDeleteUser,
      },
    },
    from: (table: string) => {
      if (table !== "legal_acceptances") {
        throw new Error(`unexpected table ${table}`)
      }
      return { insert: mockInsert }
    },
  }),
}))

jest.mock("./repository-signup", () => ({
  createProfileRepo: (...args: unknown[]) => mockCreateProfileRepo(...args),
  createEligibilitySubmissionRepo: (...args: unknown[]) => mockCreateEligibilitySubmissionRepo(...args),
}))

jest.mock("./service", () => ({
  sendNewProfileAdminEmail: jest.fn(),
  sendEmailVerificationEmail: jest.fn(),
}))

jest.mock("@/features/newsletter/server/syncNewsletterPreferences", () => ({
  syncNewsletterPreferences: jest.fn(),
}))

import { accountTermsDocument, privacyPolicyDocument } from "@/lib/content/legal"
import { signupAction } from "./signup"

const validSignup = {
  profile_type: "individual",
  name: "Ada Lovelace",
  email: "ada@example.com",
  pronouns: null,
  website: null,
  organization_name: null,
  location_place_id: null,
  location_label: null,
  newsletter_ear_opt_in: false,
  newsletter_calendar_opt_in: true,
  referral_source: "google",
  referral_source_other: null,
  self_identifies_emerging: true,
  operating_budget_range: "r_0_24999",
  operating_budget_other_text: null,
  owns_or_operates_venue: "no",
  owns_or_operates_venue_other_text: null,
  supported_by_major_institution: "no",
  supported_by_major_institution_other_text: null,
  classes_hosted_independently: "no",
  classes_hosted_independently_other_text: null,
  has_501c3: "no",
  has_501c3_other_text: null,
  password: "password1",
  confirmPassword: "password1",
  accept_account_terms_and_privacy: true,
}

describe("signupAction legal acceptance", () => {
  beforeEach(() => {
    mockListUsers.mockReset()
    mockCreateUser.mockReset()
    mockDeleteUser.mockReset()
    mockInsert.mockReset()
    mockCreateProfileRepo.mockReset()
    mockCreateEligibilitySubmissionRepo.mockReset()

    mockListUsers.mockResolvedValue({ data: { users: [] } })
    mockCreateUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null })
    mockDeleteUser.mockResolvedValue({ data: null, error: null })
    mockCreateProfileRepo.mockResolvedValue({
      id: "user-1",
      name: "Ada Lovelace",
      email: "ada@example.com",
      profile_type: "individual",
    })
    mockCreateEligibilitySubmissionRepo.mockResolvedValue({ id: "eligibility-1" })
    mockInsert.mockResolvedValue({ error: null })
  })

  it.each([
    ["empty", ""],
    ["missing", undefined],
    ["mismatched", "different1"],
  ] as const)(
    "does not create an account when confirm password is %s",
    async (_label, confirmPassword) => {
      const result = await signupAction({
        ...validSignup,
        confirmPassword,
      })

      expect(result).toEqual(expect.objectContaining({ step: "password" }))
      expect(mockCreateUser).not.toHaveBeenCalled()
      expect(mockInsert).not.toHaveBeenCalled()
      expect(mockDeleteUser).not.toHaveBeenCalled()
    }
  )

  it("does not create an account when acceptance is missing", async () => {
    const result = await signupAction({
      ...validSignup,
      accept_account_terms_and_privacy: false,
    })

    expect(result).toEqual(
      expect.objectContaining({
        step: "password",
      })
    )
    expect(mockCreateUser).not.toHaveBeenCalled()
    expect(mockInsert).not.toHaveBeenCalled()
    expect(mockDeleteUser).not.toHaveBeenCalled()
  })

  it("inserts both server-controlled rows and ignores client version and timestamp", async () => {
    const result = await signupAction({
      ...validSignup,
      document_version: "client-version",
      accepted_at: "2000-01-01T00:00:00.000Z",
    })

    expect(result).toEqual({ success: true })
    expect(mockInsert).toHaveBeenCalledTimes(1)
    expect(mockInsert).toHaveBeenCalledWith([
      {
        user_id: "user-1",
        document_key: accountTermsDocument.key,
        document_version: accountTermsDocument.version,
        listing_id: null,
      },
      {
        user_id: "user-1",
        document_key: privacyPolicyDocument.key,
        document_version: privacyPolicyDocument.version,
        listing_id: null,
      },
    ])
    expect(mockDeleteUser).not.toHaveBeenCalled()
  })

  it("deletes the new auth user when acceptance recording fails", async () => {
    mockInsert.mockResolvedValue({
      error: { message: "acceptance insert failed", code: "XX000" },
    })

    const result = await signupAction(validSignup)

    expect(result).toEqual({ error: "acceptance insert failed" })
    expect(mockCreateProfileRepo).toHaveBeenCalled()
    expect(mockCreateEligibilitySubmissionRepo).toHaveBeenCalled()
    expect(mockDeleteUser).toHaveBeenCalledWith("user-1")
  })
})
