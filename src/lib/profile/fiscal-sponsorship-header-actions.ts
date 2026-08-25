import type { FiscalSponsorshipStatus } from "@/lib/types/fiscal-sponsorship"
import {
  FISCAL_SPONSORSHIP_INQUIRY_HREF,
  FISCAL_SPONSORSHIP_PAGE_HREF,
  fiscalSponsorshipDashboard,
} from "@/lib/content/fiscal-sponsorship-dashboard"

export type FiscalSponsorshipHeaderAction = {
  id: "learn" | "apply"
  label: string
  href: string
  variant: "primary" | "secondary"
}

const learnAction = (
  variant: "primary" | "secondary",
): FiscalSponsorshipHeaderAction => ({
  id: "learn",
  label: fiscalSponsorshipDashboard.sharedCtas.learn,
  href: FISCAL_SPONSORSHIP_PAGE_HREF,
  variant,
})

const applyAction = (): FiscalSponsorshipHeaderAction => ({
  id: "apply",
  label: fiscalSponsorshipDashboard.sharedCtas.apply,
  href: FISCAL_SPONSORSHIP_INQUIRY_HREF,
  variant: "secondary",
})

/**
 * Header CTAs by fiscal status.
 * Status cards stay informational; only none/pending get actions.
 */
export function getFiscalSponsorshipHeaderActions(
  status: FiscalSponsorshipStatus,
): FiscalSponsorshipHeaderAction[] {
  if (status === "none") {
    return [learnAction("primary"), applyAction()]
  }

  if (status === "pending") {
    return [learnAction("primary")]
  }

  return []
}
