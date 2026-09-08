import { mapAdminAnnouncementRow, mapAnnouncementRow, toAnnouncementCta } from "./map-announcement"

describe("toAnnouncementCta", () => {
  it("returns a link CTA when kind, label, and href are present", () => {
    expect(toAnnouncementCta("link", "Apply", "https://example.com")).toEqual({
      kind: "link",
      label: "Apply",
      href: "https://example.com",
    })
  })

  it("keeps in-app hrefs for authenticated_link", () => {
    expect(toAnnouncementCta("authenticated_link", "Get your code", "/profile?announcement=1")).toEqual({
      kind: "authenticated_link",
      label: "Get your code",
      href: "/profile?announcement=1",
    })
  })

  it("returns null when any CTA field is missing or kind is unknown", () => {
    expect(toAnnouncementCta("link", "Apply", null)).toBeNull()
    expect(toAnnouncementCta("link", "", "https://example.com")).toBeNull()
    expect(toAnnouncementCta("popup", "Apply", "https://example.com")).toBeNull()
    expect(toAnnouncementCta(null, "Apply", "https://example.com")).toBeNull()
  })
})

describe("mapAnnouncementRow", () => {
  it("maps public fields and omits incomplete CTAs", () => {
    const mapped = mapAnnouncementRow({
      id: "a1",
      title: "Workshop",
      content: "Details at example.com/info",
      published_at: "2026-09-01T00:00:00Z",
      created_at: "2026-09-01T00:00:00Z",
      hero_image_url: "/images/workshop.jpg",
      cta_kind: "link",
      cta_label: null,
      cta_href: "https://example.com",
    })

    expect(mapped).toMatchObject({
      id: "a1",
      title: "Workshop",
      heroImageUrl: "/images/workshop.jpg",
      cta: null,
      publishedAt: "2026-09-01T00:00:00Z",
    })
  })

  it("does not leak unsafe hero URLs", () => {
    const mapped = mapAnnouncementRow({
      id: "a1",
      title: "x",
      content: "y",
      hero_image_url: "javascript:alert(1)",
    })
    expect(mapped.heroImageUrl).toBeNull()
  })

  it("does not include dashboard widget fields or codes on the public announcement", () => {
    const mapped = mapAnnouncementRow({
      id: "a1",
      title: "EAR Code",
      content: "Get your code",
      dashboard_widget: "member_code",
      dashboard_widget_label: "Your EAR member code",
      dashboard_widget_value: "SECRET-CODE",
    })
    expect(mapped).not.toHaveProperty("dashboardWidget")
    expect(mapped).not.toHaveProperty("code")
    expect(mapped).not.toHaveProperty("dashboardWidgetValue")
    expect(JSON.stringify(mapped)).not.toContain("member_code")
    expect(JSON.stringify(mapped)).not.toContain("SECRET-CODE")
  })
})

describe("mapAdminAnnouncementRow", () => {
  it("maps dashboard widget fields for admin CRUD", () => {
    const mapped = mapAdminAnnouncementRow({
      id: "a1",
      title: "EAR Code",
      content: "Get your code",
      dashboard_widget: "member_code",
      dashboard_widget_label: "Your EAR member code",
    })
    expect(mapped.dashboardWidget).toBe("member_code")
    expect(mapped.dashboardWidgetLabel).toBe("Your EAR member code")
    expect(mapped.dashboardWidgetValue).toBeNull()
  })

  it("maps a copyable_value widget and its admin-only value", () => {
    const mapped = mapAdminAnnouncementRow({
      id: "a1",
      title: "Workshop",
      content: "10% off",
      dashboard_widget: "copyable_value",
      dashboard_widget_label: "Discount code",
      dashboard_widget_value: "EAR-WORKSHOP",
    })
    expect(mapped.dashboardWidget).toBe("copyable_value")
    expect(mapped.dashboardWidgetLabel).toBe("Discount code")
    expect(mapped.dashboardWidgetValue).toBe("EAR-WORKSHOP")
  })

  it("defaults an unknown widget to none", () => {
    const mapped = mapAdminAnnouncementRow({
      id: "a1",
      title: "News",
      content: "Hello",
    })
    expect(mapped.dashboardWidget).toBe("none")
    expect(mapped.dashboardWidgetLabel).toBeNull()
    expect(mapped.dashboardWidgetValue).toBeNull()
  })
})
