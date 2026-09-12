import { announcementPatchSchema, announcementSchema } from "./announcements"

describe("announcementSchema", () => {
  it("accepts title and content only", () => {
    const parsed = announcementSchema.parse({ title: "Workshop", content: "See example.com" })
    expect(parsed.title).toBe("Workshop")
    expect(parsed.ctaKind).toBeUndefined()
    expect(parsed.ctaSecondaryKind).toBeUndefined()
  })

  it("rejects an incomplete CTA", () => {
    const result = announcementSchema.safeParse({
      title: "Workshop",
      content: "Hi",
      ctaKind: "link",
      ctaLabel: "Apply",
    })
    expect(result.success).toBe(false)
  })

  it("accepts an in-app authenticated CTA", () => {
    const parsed = announcementSchema.parse({
      title: "EAR Code",
      content: "Get your member code",
      ctaKind: "authenticated_link",
      ctaLabel: "Get your code",
      ctaHref: "/profile?announcement=abc",
    })
    expect(parsed.ctaHref).toBe("/profile?announcement=abc")
  })

  it("rejects an incomplete secondary CTA", () => {
    const result = announcementSchema.safeParse({
      title: "Workshop",
      content: "Hi",
      ctaSecondaryKind: "link",
      ctaSecondaryLabel: "Apply",
    })
    expect(result.success).toBe(false)
  })

  it("accepts a secondary announcement-page CTA", () => {
    const parsed = announcementSchema.parse({
      title: "Workshop",
      content: "Details",
      ctaKind: "authenticated_link",
      ctaLabel: "Get your code",
      ctaHref: "/profile?announcement=abc",
      ctaSecondaryKind: "link",
      ctaSecondaryLabel: "Apply",
      ctaSecondaryHref: "https://example.com/apply",
    })
    expect(parsed.ctaSecondaryKind).toBe("link")
    expect(parsed.ctaSecondaryHref).toBe("https://example.com/apply")
  })

  it("allows PATCH of title without CTA fields", () => {
    const parsed = announcementPatchSchema.parse({ title: "Updated" })
    expect(parsed.title).toBe("Updated")
    expect(parsed.isActive).toBeUndefined()
  })

  it("accepts a dashboard member-code widget", () => {
    const parsed = announcementSchema.parse({
      title: "EAR Code",
      content: "Get your member code",
      dashboardWidget: "member_code",
      dashboardWidgetLabel: "Your EAR member code",
      dashboardWidgetBody: "Copy your code for partner venues.",
    })
    expect(parsed.dashboardWidget).toBe("member_code")
    expect(parsed.dashboardWidgetLabel).toBe("Your EAR member code")
    expect(parsed.dashboardWidgetBody).toBe("Copy your code for partner venues.")
  })

  it("accepts a copyable dashboard value", () => {
    const parsed = announcementSchema.parse({
      title: "Workshop",
      content: "10% off",
      dashboardWidget: "copyable_value",
      dashboardWidgetLabel: "Discount code",
      dashboardWidgetValue: "EAR-WORKSHOP",
    })
    expect(parsed.dashboardWidget).toBe("copyable_value")
    expect(parsed.dashboardWidgetValue).toBe("EAR-WORKSHOP")
  })

  it("accepts a text-only dashboard widget without a value", () => {
    const parsed = announcementSchema.parse({
      title: "Workshop",
      content: "Details",
      dashboardWidget: "message",
      dashboardWidgetBody: "See the announcement.",
    })
    expect(parsed.dashboardWidget).toBe("message")
  })

  it("rejects a dashboard body over 500 characters", () => {
    const result = announcementSchema.safeParse({
      title: "Workshop",
      content: "10% off",
      dashboardWidget: "copyable_value",
      dashboardWidgetValue: "EAR-WORKSHOP",
      dashboardWidgetBody: "x".repeat(501),
    })
    expect(result.success).toBe(false)
  })

  it("rejects copyable_value without a value", () => {
    const result = announcementSchema.safeParse({
      title: "Workshop",
      content: "10% off",
      dashboardWidget: "copyable_value",
    })
    expect(result.success).toBe(false)
  })

  it("accepts an enabled popup with a headline", () => {
    const parsed = announcementSchema.parse({
      title: "EAR Code",
      content: "Get your member code",
      popupEnabled: true,
      popupHeadline: "Your EAR code is here",
      popupBody: "Sign in to copy it from your dashboard.",
      popupCtaLabel: "See announcement",
      popupRevision: 3,
    })
    expect(parsed.popupEnabled).toBe(true)
    expect(parsed.popupHeadline).toBe("Your EAR code is here")
    expect(parsed.popupRevision).toBe(3)
  })

  it("accepts independent Learn more flags", () => {
    const parsed = announcementSchema.parse({
      title: "EAR Code",
      content: "Get your member code",
      dashboardLearnMoreEnabled: false,
      popupEnabled: true,
      popupHeadline: "Your EAR code is here",
      popupLearnMoreEnabled: false,
      popupShowAnnouncementCta: false,
    })
    expect(parsed.dashboardLearnMoreEnabled).toBe(false)
    expect(parsed.popupLearnMoreEnabled).toBe(false)
    expect(parsed.popupShowAnnouncementCta).toBe(false)
  })

  it("rejects an enabled popup without a headline", () => {
    const result = announcementSchema.safeParse({
      title: "EAR Code",
      content: "Get your member code",
      popupEnabled: true,
    })
    expect(result.success).toBe(false)
  })
})