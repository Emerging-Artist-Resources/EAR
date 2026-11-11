import {
  announcementPhotoPathFromPublicUrl,
  createAnnouncementImageStoragePath,
  isAnnouncementPhotoStoragePath,
} from "./announcementPhotoPaths"

const OBJECT_ID = "11111111-1111-4111-8111-111111111111"
const PATH = `announcements/${OBJECT_ID}.jpg`
const PUBLIC_URL = `https://example.supabase.co/storage/v1/object/public/announcement-photos/${PATH}`

describe("announcement photo paths", () => {
  it("creates a versioned jpeg path", () => {
    expect(createAnnouncementImageStoragePath()).toMatch(
      /^announcements\/[0-9a-f-]{36}\.jpg$/
    )
  })

  it("accepts only announcement jpeg object keys", () => {
    expect(isAnnouncementPhotoStoragePath(PATH)).toBe(true)
    expect(isAnnouncementPhotoStoragePath(`profiles/user/${PATH}`)).toBe(false)
    expect(isAnnouncementPhotoStoragePath("announcements/../secret.jpg")).toBe(false)
  })

  it("reads a storage path from a public bucket URL", () => {
    expect(announcementPhotoPathFromPublicUrl(PUBLIC_URL)).toBe(PATH)
    expect(announcementPhotoPathFromPublicUrl(`${PUBLIC_URL}?t=1`)).toBe(PATH)
  })

  it("ignores static files and other hosts", () => {
    expect(announcementPhotoPathFromPublicUrl("/images/announcements/intern.png")).toBeNull()
    expect(announcementPhotoPathFromPublicUrl("https://cdn.example/hero.jpg")).toBeNull()
    expect(
      announcementPhotoPathFromPublicUrl(
        "https://example.supabase.co/storage/v1/object/public/donation-page-photos/profiles/user/donation-hero.jpg"
      )
    ).toBeNull()
  })
})
