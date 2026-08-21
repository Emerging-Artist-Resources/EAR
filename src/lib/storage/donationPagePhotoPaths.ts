/** Public bucket; must allow anonymous read for logged-out donors. See runbook. */
export const DONATION_PAGE_PHOTOS_BUCKET = "donation-page-photos"

/** Fixed object path per profile — upsert replaces the prior hero image. */
export function donationPageImageStoragePath(userId: string): string {
  return `profiles/${userId}/donation-hero.jpg`
}

export function isDonationPageImagePathForUser(userId: string, imagePath: string): boolean {
  return imagePath === donationPageImageStoragePath(userId)
}

/** Reject image paths that do not belong to the authenticated user. */
export function assertDonationPageImagePathForUser(userId: string, imagePath: string): void {
  if (!isDonationPageImagePathForUser(userId, imagePath)) {
    throw new Error("Invalid donation page image path")
  }
}
