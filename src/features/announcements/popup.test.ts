import {
  announcementLearnMoreLabel,
  announcementPopupButtonPreview,
  announcementPopupDismissKey,
  dismissAnnouncementPopup,
  isAnnouncementPopupDismissed,
  pickActivePopupAnnouncement,
  shouldSkipAnnouncementPopup,
} from "./popup"

describe("announcementPopupButtonPreview", () => {
  it("defaults Learn more and includes the action when both are on", () => {
    expect(
      announcementPopupButtonPreview({
        learnMoreEnabled: true,
        learnMoreLabel: "  ",
        showAnnouncementCta: true,
        actionLabel: "Get your code",
      })
    ).toEqual(["Learn more", "Get your code"])
  })

  it("omits disabled buttons", () => {
    expect(
      announcementPopupButtonPreview({
        learnMoreEnabled: false,
        learnMoreLabel: "See announcement",
        showAnnouncementCta: false,
        actionLabel: "Get your code",
      })
    ).toEqual([])
  })
})

describe("announcementLearnMoreLabel", () => {
  it("falls back to Learn more", () => {
    expect(announcementLearnMoreLabel("")).toBe("Learn more")
    expect(announcementLearnMoreLabel("See announcement")).toBe("See announcement")
  })
})

describe("announcementPopupDismissKey", () => {
  it("includes id and revision so a bump re-shows the popup", () => {
    expect(announcementPopupDismissKey("a1", 1)).toBe("ear:announcement-popup:a1:1")
    expect(announcementPopupDismissKey("a1", 2)).toBe("ear:announcement-popup:a1:2")
  })
})

describe("dismissAnnouncementPopup", () => {
  it("stores a dismissed flag that is revision-specific", () => {
    const store: Record<string, string> = {}
    const storage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value
      },
    }

    dismissAnnouncementPopup(storage, "a1", 1)
    expect(isAnnouncementPopupDismissed(storage, "a1", 1)).toBe(true)
    expect(isAnnouncementPopupDismissed(storage, "a1", 2)).toBe(false)
  })
})

describe("shouldSkipAnnouncementPopup", () => {
  it("skips auth, admin, donate, announcements, and listing details", () => {
    expect(shouldSkipAnnouncementPopup("/auth/signin")).toBe(true)
    expect(shouldSkipAnnouncementPopup("/admin/notifications")).toBe(true)
    expect(shouldSkipAnnouncementPopup("/donate")).toBe(true)
    expect(shouldSkipAnnouncementPopup("/donations/cancel")).toBe(true)
    expect(shouldSkipAnnouncementPopup("/announcement")).toBe(true)
    expect(shouldSkipAnnouncementPopup("/calendar", "listingId=abc")).toBe(true)
    expect(shouldSkipAnnouncementPopup("/calendar", "?listingId=abc")).toBe(true)
  })

  it("shows on public app pages without a listing modal", () => {
    expect(shouldSkipAnnouncementPopup("/")).toBe(false)
    expect(shouldSkipAnnouncementPopup("/calendar")).toBe(false)
    expect(shouldSkipAnnouncementPopup("/profile")).toBe(false)
    expect(shouldSkipAnnouncementPopup("/our-story")).toBe(false)
  })
})

describe("pickActivePopupAnnouncement", () => {
  const base = {
    popup_enabled: true,
    published_at: "2026-09-01T00:00:00Z",
    archived_at: null,
  }

  it("returns null when none are published, enabled, and unarchived", () => {
    expect(
      pickActivePopupAnnouncement([
        { id: "a", ...base, popup_enabled: false },
        { id: "b", ...base, published_at: null },
        { id: "c", ...base, archived_at: "2026-09-02T00:00:00Z" },
      ])
    ).toBeNull()
  })

  it("picks the newest published enabled popup, then id", () => {
    expect(
      pickActivePopupAnnouncement([
        { id: "older", ...base, published_at: "2026-08-01T00:00:00Z" },
        { id: "newer", ...base, published_at: "2026-09-01T00:00:00Z" },
        { id: "newer-b", ...base, published_at: "2026-09-01T00:00:00Z" },
      ])?.id
    ).toBe("newer-b")
  })
})
