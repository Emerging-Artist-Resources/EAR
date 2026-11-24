import {
  ACCOUNT_TERMS_CHECKBOX_LABEL,
  accountTermsDocument,
  COMMUNITY_CALENDAR_TERMS_CHECKBOX_LABEL,
  communityCalendarTermsDocument,
  LEGAL_DOCUMENTS,
  privacyPolicyDocument,
} from "@/lib/content/legal"
import { PUBLIC_SITEMAP_ENTRIES } from "@/lib/seo/public-routes"

describe("legal documents", () => {
  it("gives each document a non-empty path and version", () => {
    expect(LEGAL_DOCUMENTS.map((document) => document.key)).toEqual([
      "account_terms",
      "privacy_policy",
      "community_calendar_terms",
    ])

    for (const document of LEGAL_DOCUMENTS) {
      expect(document.path.startsWith("/legal/")).toBe(true)
      expect(document.path.length).toBeGreaterThan("/legal/".length)
      expect(document.version.length).toBeGreaterThan(0)
      expect(document.version.length).toBeLessThanOrEqual(64)
      expect(document.title.length).toBeGreaterThan(0)
    }
  })

  it("publishes the supplied account terms", () => {
    expect(accountTermsDocument.updatedLabel).toBe("November 23, 2026")
    expect(accountTermsDocument.sections.map((section) => section.heading).filter(Boolean)).toEqual([
      "1. Accurate Registration Information",
      "2. Account Security",
      "3. Appropriate Use",
      "4. User Content",
      "5. Privacy",
      "6. Account Suspension or Termination",
      "7. Intellectual Property",
      "8. Disclaimer",
      "9. Limitation of Liability",
      "10. Changes to These Terms",
    ])
    expect(accountTermsDocument.sections[5]?.paragraphs.join(" ")).toContain(
      `[Privacy Policy](${privacyPolicyDocument.path})`
    )
    expect(ACCOUNT_TERMS_CHECKBOX_LABEL).toBe(
      "I agree to EAR's Terms & Conditions and acknowledge that I have read EAR's Privacy Policy."
    )
  })

  it("publishes the supplied privacy policy", () => {
    expect(privacyPolicyDocument.title).toBe("Privacy Policy")
    expect(privacyPolicyDocument.updatedLabel).toBe("November 23, 2026")
    expect(privacyPolicyDocument.sections.map((section) => section.heading).filter(Boolean)).toEqual([
      "1. Information We Collect",
      "2. How We Use Your Information",
      "3. Community Calendar Submissions",
      "4. Media",
      "5. Email Communications",
      "6. Sharing Information",
      "7. Data Security",
      "8. Data Retention",
      "9. Your Rights",
      "10. Children's Privacy",
      "11. Third-Party Links",
      "12. Changes to This Privacy Policy",
      "13. Contact Us",
    ])
    expect(privacyPolicyDocument.sections[4]?.paragraphs?.join(" ")).toContain(
      `[Account Terms & Conditions](${accountTermsDocument.path})`
    )
    expect(privacyPolicyDocument.sections[13]?.paragraphs?.join(" ")).toContain(
      "[info@eararts.org](mailto:info@eararts.org)"
    )
  })

  it("publishes the supplied community calendar terms", () => {
    expect(communityCalendarTermsDocument.updatedLabel).toBe("November 23, 2026")
    expect(
      communityCalendarTermsDocument.sections.map((section) => section.heading).filter(Boolean)
    ).toEqual([
      "1. Accuracy of Information",
      "2. Permission to Publish",
      "3. Photo & Media License",
      "4. Content Standards",
      "5. No Guarantee of Publication",
      "6. Third-Party Listings",
      "7. Limitation of Liability",
      "8. Privacy",
    ])
    expect(communityCalendarTermsDocument.sections[8]?.paragraphs?.join(" ")).toContain(
      `[Privacy Policy](${privacyPolicyDocument.path})`
    )
    expect(COMMUNITY_CALENDAR_TERMS_CHECKBOX_LABEL).toBe(
      "I have read and agree to the Community Calendar Terms & Conditions. I certify that my submission is accurate to the best of my knowledge and grant EAR permission to publish my listing and use submitted media as described in these terms."
    )
  })

  it("includes each legal path in the public sitemap", () => {
    const paths = PUBLIC_SITEMAP_ENTRIES.map((entry) => entry.path)

    for (const document of LEGAL_DOCUMENTS) {
      expect(paths).toContain(document.path)
    }
  })
})
