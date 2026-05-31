import { fiscalSponsorshipFaqSections } from "./fiscal-sponsorship-faq"
import { filterFaqSections, getFaqAnswerSearchText } from "./fiscal-sponsorship-faq-search"

describe("fiscal-sponsorship-faq-search", () => {
  it("returns all sections when query is empty", () => {
    expect(filterFaqSections(fiscalSponsorshipFaqSections, "")).toHaveLength(
      fiscalSponsorshipFaqSections.length
    )
  })

  it("filters by question text", () => {
    const result = filterFaqSections(fiscalSponsorshipFaqSections, "5.5%")
    expect(result.some((section) => section.items.some((item) => item.number === "07"))).toBe(true)
    expect(result.every((section) => section.items.length > 0)).toBe(true)
  })

  it("filters by answer text", () => {
    const result = filterFaqSections(fiscalSponsorshipFaqSections, "1099")
    expect(result.flatMap((section) => section.items).some((item) => item.number === "11")).toBe(true)
  })

  it("returns no sections when nothing matches", () => {
    expect(filterFaqSections(fiscalSponsorshipFaqSections, "zzznomatch")).toHaveLength(0)
  })

  it("includes list intro and items in searchable text", () => {
    const typeCAnswer = fiscalSponsorshipFaqSections
      .flatMap((section) => section.items)
      .find((item) => item.number === "05")?.answer

    expect(typeCAnswer).toBeDefined()
    expect(getFaqAnswerSearchText(typeCAnswer!)).toContain("Creative autonomy")
  })
})
