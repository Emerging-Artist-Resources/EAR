export const fiscalSponsorshipHero = {
  title: "Fiscal Sponsorship",
} as const

export const fiscalSponsorshipExplainer = {
  title: "What is Fiscal Sponsorship?",
  body: "Fiscal sponsorship is essential for artists and performers who want to grow their work but face barriers to funding. Most grants and major donations require 501(c)(3) nonprofit status, which can be difficult and time-consuming to establish on your own. By partnering with EAR, you gain immediate access to these opportunities, including access to grants and tax-deductible donations, without the burden of building and managing a nonprofit—so you can stay focused on your creative practice.",
} as const

export type FiscalSponsorshipBenefit = {
  id: string
  title: string
  paragraphs: readonly string[]
}

export const fiscalSponsorshipBenefits = {
  sectionTitle: "Why choose EAR as your Fiscal Sponsor?",
  columns: [
    {
      id: "fee",
      title: "Low 5.5% Fee",
      paragraphs: [
        "With one of the lowest fees in the greater Metropolitan area, keep more of your funding with a competitive 5.5% fee and transparent financial reporting that keeps you in complete control.",
        "With no membership or overhead fees, there is no risk to signing up.",
      ],
    },
    {
      id: "support",
      title: "Artist-Led Support",
      paragraphs: [
        "EAR brings the structure, experience, and expertise needed to support your project at a professional level. We manage funds, ensure compliance, and provide the financial oversight that funders expect, allowing you to confidently receive grants and tax-deductible donations. Our team understands the unique needs of artists and performers and is equipped to help you navigate complex funding systems.",
      ],
    },
    {
      id: "partnership",
      title: "Cared-For Partnership",
      paragraphs: [
        "Beyond administration, EAR is committed to helping you build long-term sustainability. We support your fundraising efforts, strengthen your credibility, and position your work for larger opportunities. With EAR as your fiscal sponsor, you gain a trusted partner dedicated to helping dancers and performers access resources, expand their reach, and focus on what matters most: creating and performing.",
      ],
    },
  ] satisfies readonly FiscalSponsorshipBenefit[],
} as const

export const fiscalSponsorshipCtaBand = {
  overline: "Getting started",
  headline: "Ready to Apply?",
  body: "We partner with emerging artists and small collectives who are seeking a professional home for their project's financial growth. To be eligible, your work must demonstrate a clear artistic vision and social contribution. Before applying, gather your project narrative, a basic budget draft, and an updated professional resume or artist statement.",
} as const

export const fiscalSponsorshipPartnership = {
  paragraphs: [
    "EAR is thrilled to announce our partnership with mignolo, an exciting step forward in expanding access, sustainability, and support for artists.",
    "Rooted in a deep commitment to the arts, mignolo brings years of hands-on experience across multiple facets of the creative ecosystem. As a multifaceted arts organization, their work spans a dance company, a dynamic arts center in Meutchen, NY—serving as a rehearsal studio, gallery, and black box performance space—and a thoughtfully curated magazine. Their breadth of practice reflects a holistic understanding of what artists need not only to create, but to thrive.",
    "What makes this partnership especially meaningful is the depth of knowledge behind it. With a foundation in accounting and business ownership, mignolo offers a rare combination of artistic vision and financial expertise. This makes them an invaluable collaborator in providing fiscal sponsorship with integrity, clarity, and care.",
    "Together, EAR and mignolo are committed to breaking down financial barriers and building more accessible pathways for artists to bring their work to life. This partnership is not just about infrastructure—it's about possibility.",
  ],
} as const

export const FISCAL_SPONSORSHIP_INQUIRY_HREF = "/services/fiscal-sponsorship/inquiry" as const

export const FISCAL_SPONSORSHIP_FAQ_HREF = "/services/fiscal-sponsorship/faq" as const

export const FISCAL_SPONSORSHIP_HERO_IMAGE = "/images/fiscal-sponsorship/hero-image.JPG" as const

export const FISCAL_SPONSORSHIP_EXPLAINER_IMAGE =
  "/images/fiscal-sponsorship/fiscal-sponsorshop-image.JPG" as const

export const FISCAL_SPONSORSHIP_PARTNERSHIP_IMAGE =
  "/images/fiscal-sponsorship/mignolo-image.png" as const