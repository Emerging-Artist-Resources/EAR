import { ROUTES } from "@/lib/config/constants"

export const dashboardNavItems = [
  { name: "Dashboard", href: ROUTES.PROFILE },
  { name: "Listings", href: ROUTES.PROFILE_LISTINGS },
  { name: "Saved", href: ROUTES.PROFILE_SAVED },
  { name: "Fiscal Sponsorship", href: ROUTES.PROFILE_FISCAL_SPONSORSHIP },
  { name: "Profile", href: ROUTES.PROFILE_ACCOUNT },
  { name: "Settings", href: ROUTES.PROFILE_SETTINGS },
] as const
