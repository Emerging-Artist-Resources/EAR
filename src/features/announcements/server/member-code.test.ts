import {
  getMemberCodeForFiscalSponsorshipStatus,
  toResolvedDashboardAnnouncements,
} from "./member-code"
import type { FiscalSponsorshipStatus } from "@/lib/types/fiscal-sponsorship"

const codes = {
  standardCode: "STD-1",
  fiscalSponsorCode: "FISCAL-9",
}

describe("getMemberCodeForFiscalSponsorshipStatus", () => {
  it("returns the fiscal sponsor code only when approved", () => {
    expect(getMemberCodeForFiscalSponsorshipStatus("approved", codes)).toBe("FISCAL-9")
  })

  it.each([
    "none",
    "pending",
    "paused",
    "revoked",
  ] as FiscalSponsorshipStatus[])("returns the standard code for %s", (status) => {
    expect(getMemberCodeForFiscalSponsorshipStatus(status, codes)).toBe("STD-1")
  })

  it("returns the standard code for null or undefined status", () => {
    expect(getMemberCodeForFiscalSponsorshipStatus(null, codes)).toBe("STD-1")
    expect(getMemberCodeForFiscalSponsorshipStatus(undefined, codes)).toBe("STD-1")
  })
})

describe("toResolvedDashboardAnnouncements", () => {
  const memberRow = {
    id: "a1",
    title: "Your EAR Code",
    content: "Use this at partner venues. Long announcement copy.",
    dashboard_widget: "member_code",
    dashboard_widget_label: "Your EAR member code",
    dashboard_widget_body: "Copy this for partner venues.",
  }

  it("resolves member_code rows to a copyable value from fiscal status", () => {
    const resolved = toResolvedDashboardAnnouncements(
      [memberRow, { id: "a2", title: "News", content: "Hello", dashboard_widget: "none" }],
      "approved",
      codes
    )
    expect(resolved).toEqual([
      {
        id: "a1",
        title: "Your EAR Code",
        body: "Copy this for partner venues.",
        showLearnMore: true,
        widget: {
          kind: "copyable_value",
          value: "FISCAL-9",
          label: "Your EAR member code",
        },
      },
    ])
    expect(JSON.stringify(resolved)).not.toContain("STD-1")
    expect(JSON.stringify(resolved)).not.toContain("Long announcement copy")
  })

  it("uses the standard code when not approved and omits empty labels", () => {
    const resolved = toResolvedDashboardAnnouncements(
      [{ ...memberRow, dashboard_widget_label: "  " }],
      "pending",
      codes
    )
    expect(resolved[0].widget).toEqual({ kind: "copyable_value", value: "STD-1" })
    expect(JSON.stringify(resolved)).not.toContain("FISCAL-9")
  })

  it("does not fall back to announcement content when dashboard body is empty", () => {
    const resolved = toResolvedDashboardAnnouncements(
      [{ ...memberRow, dashboard_widget_body: "  " }],
      "approved",
      codes
    )
    expect(resolved[0].body).toBe("")
    expect(JSON.stringify(resolved)).not.toContain("Long announcement copy")
  })

  it("uses the admin-supplied value for copyable_value widgets", () => {
    const resolved = toResolvedDashboardAnnouncements(
      [
        {
          id: "w1",
          title: "Workshop discount",
          content: "10% off this weekend. Full details on the announcement.",
          dashboard_widget: "copyable_value",
          dashboard_widget_label: "Discount code",
          dashboard_widget_value: "EAR-WORKSHOP",
          dashboard_widget_body: "10% off this weekend.",
        },
      ],
      "approved",
      codes
    )
    expect(resolved).toEqual([
      {
        id: "w1",
        title: "Workshop discount",
        body: "10% off this weekend.",
        showLearnMore: true,
        widget: {
          kind: "copyable_value",
          value: "EAR-WORKSHOP",
          label: "Discount code",
        },
      },
    ])
    expect(JSON.stringify(resolved)).not.toContain("FISCAL-9")
    expect(JSON.stringify(resolved)).not.toContain("Full details")
  })

  it("skips copyable_value rows without a value", () => {
    const resolved = toResolvedDashboardAnnouncements(
      [
        {
          id: "w1",
          title: "Workshop",
          content: "Soon",
          dashboard_widget: "copyable_value",
          dashboard_widget_value: "  ",
        },
      ],
      "approved",
      codes
    )
    expect(resolved).toEqual([])
  })

  it("honors dashboard_learn_more_enabled when it is off", () => {
    const resolved = toResolvedDashboardAnnouncements(
      [{ ...memberRow, dashboard_learn_more_enabled: false }],
      "approved",
      codes
    )
    expect(resolved[0].showLearnMore).toBe(false)
  })

  it("resolves message widgets without a copyable value", () => {
    const resolved = toResolvedDashboardAnnouncements(
      [
        {
          id: "m1",
          title: "Workshop",
          dashboard_widget: "message",
          dashboard_widget_body: "Sign up this week.",
          dashboard_widget_value: "SHOULD-NOT-SHOW",
        },
      ],
      "approved",
      codes
    )
    expect(resolved).toEqual([
      {
        id: "m1",
        title: "Workshop",
        body: "Sign up this week.",
        showLearnMore: true,
        widget: null,
      },
    ])
    expect(JSON.stringify(resolved)).not.toContain("SHOULD-NOT-SHOW")
  })
})
