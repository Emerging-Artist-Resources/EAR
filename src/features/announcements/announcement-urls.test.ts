import {
  isAppPath,
  isSafeAnnouncementUrl,
  normalizeAnnouncementUrl,
} from "./announcement-urls"

describe("announcement-urls", () => {
  it("treats in-app paths as safe", () => {
    expect(isAppPath("/profile?announcement=abc")).toBe(true)
    expect(isSafeAnnouncementUrl("/images/workshop.jpg")).toBe(true)
    expect(normalizeAnnouncementUrl("/announcement?id=1")).toBe("/announcement?id=1")
  })

  it("rejects protocol-relative and javascript URLs", () => {
    expect(isAppPath("//evil.example")).toBe(false)
    expect(isSafeAnnouncementUrl("javascript:alert(1)")).toBe(false)
    expect(normalizeAnnouncementUrl("javascript:alert(1)")).toBeNull()
  })

  it("normalizes bare domains to https", () => {
    expect(normalizeAnnouncementUrl("example.com/apply")).toBe("https://example.com/apply")
  })
})
