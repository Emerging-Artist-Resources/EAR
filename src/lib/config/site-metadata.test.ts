import {
  buildNoIndexMetadata,
  buildOrgDonationMetadata,
  buildPageMetadata,
  buildSiteMetadata,
} from "@/lib/config/site-metadata"

describe("site metadata canonical URLs", () => {
  it("sets homepage canonical in buildSiteMetadata", () => {
    expect(buildSiteMetadata().alternates?.canonical).toBe("/")
  })

  it("sets page canonical from path in buildPageMetadata", () => {
    const metadata = buildPageMetadata({
      title: "About Us",
      description: "Meet the EAR team.",
      path: "/about-us",
    })

    expect(metadata.alternates?.canonical).toBe("/about-us")
  })

  it("sets canonical on donation metadata built via buildPageMetadata", () => {
    expect(buildOrgDonationMetadata().alternates?.canonical).toBe("/donate")
  })
})

describe("buildNoIndexMetadata", () => {
  it("prevents indexing and following", () => {
    expect(buildNoIndexMetadata().robots).toEqual({
      index: false,
      follow: false,
    })
  })
})
