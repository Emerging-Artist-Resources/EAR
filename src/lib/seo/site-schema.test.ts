import { getPublicAppUrl } from "@/lib/config/app-url"
import { buildOrganizationSchema, buildSiteJsonLd, buildWebSiteSchema } from "@/lib/seo/site-schema"

jest.mock("@/lib/config/app-url", () => ({
  getPublicAppUrl: jest.fn(() => "https://www.eararts.org"),
}))

const mockedGetPublicAppUrl = jest.mocked(getPublicAppUrl)

describe("site schema", () => {
  beforeEach(() => {
    mockedGetPublicAppUrl.mockReturnValue("https://www.eararts.org")
  })

  it("builds Organization schema with contact and social links", () => {
    const schema = buildOrganizationSchema()

    expect(schema["@type"]).toBe("Organization")
    expect(schema.name).toBe("Emerging Artist Resources")
    expect(schema.alternateName).toBe("EAR")
    expect(schema.url).toBe("https://www.eararts.org")
    expect(schema.logo).toBe("https://www.eararts.org/images/og-image.png")
    expect(schema.email).toBe("info@eararts.org")
    expect(schema.address).toMatchObject({
      "@type": "PostalAddress",
      streetAddress: "54 Noll St, 757",
      addressLocality: "Brooklyn",
      addressRegion: "NY",
      postalCode: "11206",
      addressCountry: "US",
    })
    expect(schema.sameAs).toEqual(
      expect.arrayContaining(["https://www.instagram.com/emergingartistresources"])
    )
  })

  it("builds WebSite schema linked to Organization", () => {
    const schema = buildWebSiteSchema()

    expect(schema["@type"]).toBe("WebSite")
    expect(schema.name).toBe("Emerging Artist Resources")
    expect(schema.url).toBe("https://www.eararts.org")
    expect(schema.publisher).toEqual({ "@id": "https://www.eararts.org/#organization" })
  })

  it("combines Organization and WebSite in a graph", () => {
    const jsonLd = buildSiteJsonLd()

    expect(jsonLd["@context"]).toBe("https://schema.org")
    expect(jsonLd["@graph"]).toHaveLength(2)
    expect(jsonLd["@graph"][0]["@type"]).toBe("Organization")
    expect(jsonLd["@graph"][1]["@type"]).toBe("WebSite")
  })
})
