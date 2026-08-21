/** Public bucket; must allow anonymous read for logged-out donors. See runbook. */
export const DONATION_PAGE_PHOTOS_BUCKET = "donation-page-photos"

const UUID_PATTERN =
  "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"

/** Legacy fixed key plus versioned keys: donation-hero.jpg | donation-hero-{uuid}.jpg */
const DONATION_HERO_FILENAME_PATTERN = new RegExp(
  `^donation-hero(?:-${UUID_PATTERN})?\\.jpg$`,
)

function createDonationHeroObjectId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID()
  }

  // Jest / older runtimes without Web Crypto UUID support
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const nibble = (Math.random() * 16) | 0
    const value = char === "x" ? nibble : (nibble & 0x3) | 0x8
    return value.toString(16)
  })
}

/**
 * Create a new storage object path for a donation page hero image.
 * Each call returns a distinct key so uploads never overwrite a live object before PATCH succeeds.
 */
export function createDonationPageImageStoragePath(userId: string): string {
  return `profiles/${userId}/donation-hero-${createDonationHeroObjectId()}.jpg`
}

/**
 * True when `imagePath` is a donation hero object owned by `userId`
 * (versioned key or legacy fixed `donation-hero.jpg`).
 */
export function isDonationPageImageStoragePathOwnedByUser(
  imagePath: string,
  userId: string,
): boolean {
  const prefix = `profiles/${userId}/`
  if (!imagePath.startsWith(prefix)) {
    return false
  }

  const filename = imagePath.slice(prefix.length)
  if (filename.includes("/") || filename.includes("..")) {
    return false
  }

  return DONATION_HERO_FILENAME_PATTERN.test(filename)
}

/** Reject image paths that do not belong to the authenticated user. */
export function assertDonationPageImageStoragePathOwnedByUser(
  imagePath: string,
  userId: string,
): void {
  if (!isDonationPageImageStoragePathOwnedByUser(imagePath, userId)) {
    throw new Error("Invalid donation page image path")
  }
}
