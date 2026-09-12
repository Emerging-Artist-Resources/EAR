import {
  emptyAnnouncementForm,
  toAnnouncementSavePayload,
} from "./announcement-admin-form"

describe("toAnnouncementSavePayload", () => {
  it("always sends popup Learn more flags and omits dashboard fields when off", () => {
    const payload = toAnnouncementSavePayload(
      {
        ...emptyAnnouncementForm,
        title: "Workshop",
        content: "Details",
        popupEnabled: true,
        popupHeadline: "Hello",
        popupLearnMoreEnabled: false,
        popupShowAnnouncementCta: true,
      },
      null
    )

    expect(payload.popupLearnMoreEnabled).toBe(false)
    expect(payload.popupShowAnnouncementCta).toBe(true)
    expect(payload.dashboardWidget).toBeUndefined()
  })

  it("clears dashboard fields when turning a widget off", () => {
    const payload = toAnnouncementSavePayload(emptyAnnouncementForm, {
      id: "a1",
      title: "EAR Code",
      content: "Get your code",
      publishedAt: null,
      heroImageUrl: null,
      cta: null,
      secondaryCta: null,
      archivedAt: null,
      authorUserId: null,
      dashboardWidget: "member_code",
      dashboardWidgetLabel: "Your code",
      dashboardWidgetValue: null,
      dashboardWidgetBody: "Copy it",
      dashboardLearnMoreEnabled: true,
      popupEnabled: false,
      popupHeadline: null,
      popupBody: null,
      popupCtaLabel: null,
      popupLearnMoreEnabled: true,
      popupShowAnnouncementCta: true,
      popupRevision: 1,
    })

    expect(payload.dashboardWidget).toBe("none")
    expect(payload.dashboardWidgetLabel).toBeNull()
    expect(payload.dashboardWidgetBody).toBeNull()
  })

  it("saves a text-only dashboard widget without a copyable value", () => {
    const payload = toAnnouncementSavePayload(
      {
        ...emptyAnnouncementForm,
        title: "Workshop",
        content: "Details",
        dashboardWidget: "message",
        dashboardWidgetLabel: "leftover",
        dashboardWidgetValue: "LEFTOVER",
        dashboardWidgetBody: "Come this weekend.",
      },
      null
    )

    expect(payload.dashboardWidget).toBe("message")
    expect(payload.dashboardWidgetLabel).toBeNull()
    expect(payload.dashboardWidgetValue).toBeNull()
    expect(payload.dashboardWidgetBody).toBe("Come this weekend.")
  })

  it("saves and can clear a secondary announcement-page CTA", () => {
    const saved = toAnnouncementSavePayload(
      {
        ...emptyAnnouncementForm,
        title: "Workshop",
        content: "Details",
        ctaKind: "authenticated_link",
        ctaLabel: "Get your code",
        ctaHref: "/profile?announcement=a1",
        ctaSecondaryKind: "link",
        ctaSecondaryLabel: "Apply",
        ctaSecondaryHref: "https://example.com/apply",
      },
      null
    )
    expect(saved.ctaKind).toBe("authenticated_link")
    expect(saved.ctaSecondaryKind).toBe("link")
    expect(saved.ctaSecondaryLabel).toBe("Apply")
    expect(saved.ctaSecondaryHref).toBe("https://example.com/apply")

    const cleared = toAnnouncementSavePayload(emptyAnnouncementForm, null)
    expect(cleared.ctaKind).toBeNull()
    expect(cleared.ctaSecondaryKind).toBeNull()
    expect(cleared.ctaSecondaryLabel).toBeNull()
    expect(cleared.ctaSecondaryHref).toBeNull()
  })
})
