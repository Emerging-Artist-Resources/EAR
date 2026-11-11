import { announcementPhotoPathFromPublicUrl } from "@/lib/storage/announcementPhotoPaths"

export type AnnouncementImageSaveDeps = {
  upload: (file: File) => Promise<string>
  remove: (imageUrl: string) => Promise<void>
  save: (body: Record<string, unknown>) => Promise<unknown>
}

async function bestEffortRemove(
  remove: (imageUrl: string) => Promise<void>,
  imageUrl: string
): Promise<void> {
  try {
    await remove(imageUrl)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn("[storage] Failed to remove announcement image:", message)
  }
}

function bucketImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl) return null
  return announcementPhotoPathFromPublicUrl(imageUrl) ? imageUrl : null
}

/**
 * Persist an announcement with the same image lifecycle as donation page photos:
 * - Replace: upload → save public URL → best-effort delete previous bucket object
 *   (delete the new object if save fails)
 * - Remove: save null → best-effort delete previous bucket object
 * - No image change: save the payload as-is
 * Static `/images/...` URLs and other hosts are never deleted.
 */
export async function saveAnnouncementWithImageChanges(params: {
  payload: Record<string, unknown>
  pendingFile?: File | null
  removeExisting: boolean
  previousImageUrl: string | null
  deps: AnnouncementImageSaveDeps
}): Promise<void> {
  const { payload, pendingFile, removeExisting, previousImageUrl, deps } = params
  const previousBucketUrl = bucketImageUrl(previousImageUrl)

  if (pendingFile) {
    const newUrl = await deps.upload(pendingFile)

    try {
      await deps.save({
        ...payload,
        heroImageUrl: newUrl,
      })
    } catch (error) {
      await bestEffortRemove(deps.remove, newUrl)
      throw error
    }

    if (previousBucketUrl && previousBucketUrl !== newUrl) {
      await bestEffortRemove(deps.remove, previousBucketUrl)
    }
    return
  }

  if (removeExisting) {
    await deps.save({
      ...payload,
      heroImageUrl: null,
    })

    if (previousBucketUrl) {
      await bestEffortRemove(deps.remove, previousBucketUrl)
    }
    return
  }

  await deps.save(payload)
}
