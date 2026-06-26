import { getPublicAppUrl } from "@/lib/config/app-url"
import { fiscalSponsorshipFaqSections } from "@/lib/content/fiscal-sponsorship-faq"
import { buildFiscalSponsorshipFaqJsonLd } from "@/lib/seo/faq-schema"

jest.mock("@/lib/config/app-url", () => ({
  getPublicAppUrl: jest.fn(() => "https://www.eararts.org"),
}))

const mockedGetPublicAppUrl = jest.mocked(getPublicAppUrl)

describe("fiscal sponsorship FAQ schema", () => {
  beforeEach(() => {
    mockedGetPublicAppUrl.mockReturnValue("https://www.eararts.org")
  })

  it("builds FAQPage schema with all FAQ items", () => {
    const expectedCount = fiscalSponsorshipFaqSections.reduce(
      (count, section) => count + section.items.length,
      0
    )
    const jsonLd = buildFiscalSponsorshipFaqJsonLd()

    expect(jsonLd["@type"]).toBe("FAQPage")
    expect(jsonLd["@id"]).toBe("https://www.eararts.org/services/fiscal-sponsorship/faq#faq")
    expect(jsonLd.mainEntity).toHaveLength(expectedCount)
  })

  it("maps questions and answers from FAQ content", () => {
    const jsonLd = buildFiscalSponsorshipFaqJsonLd()
    const firstQuestion = jsonLd.mainEntity[0]

    expect(firstQuestion).toEqual({
      "@type": "Question",
      name: "What is fiscal sponsorship?",
      acceptedAnswer: {
        "@type": "Answer",
        text: expect.stringContaining("501(c)(3) tax-exempt status"),
      },
    })
  })

  it("includes list answers with intro and items", () => {
    const jsonLd = buildFiscalSponsorshipFaqJsonLd()
    const typeCQuestion = jsonLd.mainEntity.find(
      (item) => item.name === "What are the benefits of Type-C fiscal sponsorship?"
    )

    expect(typeCQuestion?.acceptedAnswer.text).toContain("Type-C fiscal sponsorship is designed")
    expect(typeCQuestion?.acceptedAnswer.text).toContain("Access to funding")
    expect(typeCQuestion?.acceptedAnswer.text).toContain("Creative autonomy")
  })
})
