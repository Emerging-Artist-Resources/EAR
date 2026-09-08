import { announcementPatchSchema, announcementSchema } from "./announcements"

describe("announcementSchema", () => {
  it("accepts title and content only", () => {
    const parsed = announcementSchema.parse({ title: "Workshop", content: "See example.com" })
    expect(parsed.title).toBe("Workshop")
    expect(parsed.ctaKind).toBeUndefined()
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
    })
    expect(parsed.dashboardWidget).toBe("member_code")
    expect(parsed.dashboardWidgetLabel).toBe("Your EAR member code")
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

  it("rejects copyable_value without a value", () => {
    const result = announcementSchema.safeParse({
      title: "Workshop",
      content: "10% off",
      dashboardWidget: "copyable_value",
    })
    expect(result.success).toBe(false)
  })
})