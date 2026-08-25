import {
  getFiscalSponsorshipHeaderActions,
} from "./fiscal-sponsorship-header-actions"
import {
  FISCAL_SPONSORSHIP_INQUIRY_HREF,
  FISCAL_SPONSORSHIP_PAGE_HREF,
  fiscalSponsorshipDashboard,
} from "@/lib/content/fiscal-sponsorship-dashboard"

describe("getFiscalSponsorshipHeaderActions", () => {
  it("returns Learn + Apply for none", () => {
    expect(getFiscalSponsorshipHeaderActions("none")).toEqual([
      {
        id: "learn",
        label: fiscalSponsorshipDashboard.sharedCtas.learn,
        href: FISCAL_SPONSORSHIP_PAGE_HREF,
        variant: "primary",
      },
      {
        id: "apply",
        label: fiscalSponsorshipDashboard.sharedCtas.apply,
        href: FISCAL_SPONSORSHIP_INQUIRY_HREF,
        variant: "secondary",
      },
    ])
  })

  it("returns Learn only for pending (not View application / inquiry)", () => {
    expect(getFiscalSponsorshipHeaderActions("pending")).toEqual([
      {
        id: "learn",
        label: fiscalSponsorshipDashboard.sharedCtas.learn,
        href: FISCAL_SPONSORSHIP_PAGE_HREF,
        variant: "primary",
      },
    ])
  })

  it("returns no header actions for enrolled or closed statuses", () => {
    expect(getFiscalSponsorshipHeaderActions("approved")).toEqual([])
    expect(getFiscalSponsorshipHeaderActions("paused")).toEqual([])
    expect(getFiscalSponsorshipHeaderActions("revoked")).toEqual([])
  })
})
