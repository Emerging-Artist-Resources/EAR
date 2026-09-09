import {
  announcementTimestamp,
  formatAnnouncementPostedDate,
  isNewAnnouncement,
} from "./announcement-date"

describe("announcementTimestamp", () => {
  it("prefers publishedAt over createdAt", () => {
    expect(
      announcementTimestamp({
        publishedAt: "2026-09-01T00:00:00.000Z",
        createdAt: "2026-08-01T00:00:00.000Z",
      })
    ).toBe("2026-09-01T00:00:00.000Z")
  })

  it("falls back to createdAt", () => {
    expect(announcementTimestamp({ publishedAt: null, createdAt: "2026-08-01T00:00:00.000Z" })).toBe(
      "2026-08-01T00:00:00.000Z"
    )
  })
})

describe("formatAnnouncementPostedDate", () => {
  it("formats a calendar date", () => {
    expect(formatAnnouncementPostedDate("2026-09-03T12:00:00.000Z")).toBe("September 3, 2026")
  })

  it("returns empty for missing or invalid dates", () => {
    expect(formatAnnouncementPostedDate(null)).toBe("")
    expect(formatAnnouncementPostedDate("not-a-date")).toBe("")
  })
})

describe("isNewAnnouncement", () => {
  const now = new Date("2026-09-08T12:00:00.000Z")

  it("is true within 7 days", () => {
    expect(isNewAnnouncement("2026-09-07T12:00:00.000Z", now)).toBe(true)
    expect(isNewAnnouncement("2026-09-02T12:00:00.000Z", now)).toBe(true)
  })

  it("is false at 7 days or older, and for future dates", () => {
    expect(isNewAnnouncement("2026-09-01T12:00:00.000Z", now)).toBe(false)
    expect(isNewAnnouncement("2026-09-09T12:00:00.000Z", now)).toBe(false)
    expect(isNewAnnouncement(null, now)).toBe(false)
  })
})
