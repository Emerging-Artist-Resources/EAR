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
})
