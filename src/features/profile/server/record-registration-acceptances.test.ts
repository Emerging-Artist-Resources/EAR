import { accountTermsDocument, privacyPolicyDocument } from "@/lib/content/legal"
import { buildRegistrationAcceptanceRows } from "./record-registration-acceptances"

describe("buildRegistrationAcceptanceRows", () => {
  it("returns both registration rows with server versions and no timestamp", () => {
    const rows = buildRegistrationAcceptanceRows("user-1")

    expect(rows).toEqual([
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
    expect(rows.map((row) => row.document_key)).toEqual(["account_terms", "privacy_policy"])
    expect(rows.every((row) => row.document_version === "2026-11-23")).toBe(true)
    for (const row of rows) {
      expect(row).not.toHaveProperty("accepted_at")
      expect(Object.keys(row).sort()).toEqual(
        ["document_key", "document_version", "listing_id", "user_id"].sort()
      )
    }
  })
})
