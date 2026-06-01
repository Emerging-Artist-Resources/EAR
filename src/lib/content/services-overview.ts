export const servicesOverviewHero = {
  title: "Services",
} as const

export const SERVICES_OVERVIEW_HERO_IMAGE = "/images/service-hero.JPG" as const

export type ServiceOverviewItem = {
  title: string
  description: string
  href: string
  iconSrc: string
  iconAlt: string
}

export const serviceOverviewItems: ServiceOverviewItem[] = [
  {
    title: "Fiscal\nServices",
    description:
      "Bookkeeping, fiscal mentorship, and hourly support to help artists and small collectives build clear, sustainable financial systems.",
    href: "/services/fiscal-services",
    iconSrc: "/icons/admin-icon.png",
    iconAlt: "Fiscal services",
  },
  {
    title: "Fiscal\nSponsorship",
    description:
      "Operate under our 501(c)(3) status to apply for institutional grants and accept tax-deductible donations without incorporating your own nonprofit.",
    href: "/services/fiscal-sponsorship",
    iconSrc: "/icons/fiscal-sponsorship-icon.png",
    iconAlt: "Fiscal sponsorship",
  },
  {
    title: "Photography &\nVideography",
    description:
      "Professional documentation for performances, rehearsals, and creative work—so you can share your process and preserve your projects with clarity.",
    href: "/services/photography-videography",
    iconSrc: "/icons/photography-videography-icon.png",
    iconAlt: "Photography and videography",
  },
]
