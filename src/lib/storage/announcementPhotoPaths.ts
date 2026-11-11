/** Public bucket so announcement cards can load the image without a signed URL. */
export const ANNOUNCEMENT_PHOTOS_BUCKET = "announcement-photos"

const UUID_PATTERN =
  "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"

const ANNOUNCEMENT_PHOTO_PATH_PATTERN = new RegExp(`^announcements/${UUID_PATTERN}\\.jpg$`)

const PUBLIC_OBJECT_MARKER = `/storage/v1/object/public/${ANNOUNCEMENT_PHOTOS_BUCKET}/`

function createAnnouncementPhotoObjectId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID()
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const nibble = (Math.random() * 16) | 0
    const value = char === "x" ? nibble : (nibble & 0x3) | 0x8
    return value.toString(16)
  })
}

/** Distinct key so a new upload never overwrites a live object before save succeeds. */
export function createAnnouncementImageStoragePath(): string {
  return `announcements/${createAnnouncementPhotoObjectId()}.jpg`
}

export function isAnnouncementPhotoStoragePath(imagePath: string): boolean {
  if (imagePath.includes("..") || imagePath.includes("\\")) return false
  return ANNOUNCEMENT_PHOTO_PATH_PATTERN.test(imagePath)
}

/**
 * Storage path when `url` points at this bucket. Static `/images/...` paths and
 * other hosts return null so save cleanup leaves them alone.
 */
export function announcementPhotoPathFromPublicUrl(url: string): string | null {
  const index = url.indexOf(PUBLIC_OBJECT_MARKER)
  if (index === -1) return null

  const raw = url.slice(index + PUBLIC_OBJECT_MARKER.length).split(/[?#]/)[0]
  let path: string
  try {
    path = decodeURIComponent(raw)
  } catch {
    return null
  }

  return isAnnouncementPhotoStoragePath(path) ? path : null
}
