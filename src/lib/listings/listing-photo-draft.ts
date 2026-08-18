/** Max promotional images per listing (matches PhotoUploader default). */
export const LISTING_PHOTO_MAX = 5

export type ListingPhotoDraftExisting = {
  key: string
  kind: "existing"
  path: string
}

export type ListingPhotoDraftNew = {
  key: string
  kind: "new"
  file: File
  /** Owned by ListingPhotoManager — create/revoke only there. */
  previewUrl: string
}

export type ListingPhotoDraftItem = ListingPhotoDraftExisting | ListingPhotoDraftNew

export type ListingPhotoSubmitPlanItem =
  | { kind: "existing"; path: string }
  | { kind: "new"; file: File; draftIndex: number }

export type ListingPhotoSubmitPlan = {
  orderedItems: ListingPhotoSubmitPlanItem[]
  /** Kept paths in draft order — Phase 1 migrate intersection source. */
  existingPaths: string[]
}

export function existingListingPhotoKey(path: string): string {
  return `existing:${path}`
}

export function newListingPhotoKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `new:${crypto.randomUUID()}`
  }
  return `new:${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/**
 * Seed draft from owner load photos.
 * Canonical order comes from ownerListingToFormLoad (sorted by sort_order) — do not re-sort here.
 */
export function seedListingPhotoDraftFromExisting(
  photos: Array<{ path: string }>
): ListingPhotoDraftExisting[] {
  const out: ListingPhotoDraftExisting[] = []
  for (const photo of photos) {
    if (!photo.path) continue
    out.push({
      key: existingListingPhotoKey(photo.path),
      kind: "existing",
      path: photo.path,
    })
    if (out.length >= LISTING_PHOTO_MAX) break
  }
  return out
}

export function getListingPhotoRemainingSlots(
  items: readonly ListingPhotoDraftItem[],
  max: number = LISTING_PHOTO_MAX
): number {
  return Math.max(0, max - items.length)
}

/** Take the first N files that fit remaining slots (call before compression). */
export function takeFilesForRemainingSlots(
  files: readonly File[],
  remainingSlots: number
): File[] {
  if (remainingSlots <= 0) return []
  return files.slice(0, remainingSlots)
}

export function setListingPhotoAsCover<T>(items: readonly T[], index: number): T[] {
  if (index < 0 || index >= items.length) return [...items]
  if (index === 0) return [...items]
  const next = [...items]
  const [moved] = next.splice(index, 1)
  next.unshift(moved)
  return next
}

export function removeListingPhotoAt<T>(items: readonly T[], index: number): T[] {
  if (index < 0 || index >= items.length) return [...items]
  return items.filter((_, i) => i !== index)
}

export function buildListingPhotoSubmitPlan(
  items: readonly ListingPhotoDraftItem[]
): ListingPhotoSubmitPlan {
  const orderedItems: ListingPhotoSubmitPlanItem[] = []
  const existingPaths: string[] = []

  items.forEach((item, draftIndex) => {
    if (item.kind === "existing") {
      orderedItems.push({ kind: "existing", path: item.path })
      existingPaths.push(item.path)
      return
    }
    orderedItems.push({ kind: "new", file: item.file, draftIndex })
  })

  return { orderedItems, existingPaths }
}
