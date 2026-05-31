import { FISCAL_SPONSORSHIP_FAQ_HREF } from "@/lib/content/fiscal-sponsorship"

export type ServicesNavSubItem = {
  label: string
  href: string
}

export type ServicesNavItem = {
  label: string
  href: string
  subItems?: ServicesNavSubItem[]
}

export const servicesNavItems: ServicesNavItem[] = [
  { label: "Photography & Videography", href: "/services/photography-videography" },
  {
    label: "Fiscal Sponsorship",
    href: "/services/fiscal-sponsorship",
    subItems: [{ label: "FAQ", href: FISCAL_SPONSORSHIP_FAQ_HREF }],
  },
  { label: "Fiscal Services", href: "/services/fiscal-services" },
]
