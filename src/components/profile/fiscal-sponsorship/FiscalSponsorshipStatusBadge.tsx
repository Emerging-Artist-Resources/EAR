import type { FiscalSponsorshipStatus } from "@/lib/types/fiscal-sponsorship"
import { Badge } from "@/components/ui/badge"
import {
  FISCAL_STATUS_BADGE_CLASS,
  FISCAL_STATUS_LABELS,
} from "@/lib/content/fiscal-sponsorship-dashboard"

export function FiscalSponsorshipStatusBadge({
  status,
}: {
  status: FiscalSponsorshipStatus
}) {
  return (
    <Badge className={FISCAL_STATUS_BADGE_CLASS[status]}>
      {FISCAL_STATUS_LABELS[status]}
    </Badge>
  )
}
