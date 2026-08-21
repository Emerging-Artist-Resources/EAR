import type { UpdateDonationPageData } from "@/lib/validations/donation-page"

export type DonationPageImageSaveDeps = {
  upload: (userId: string, file: File) => Promise<string>
  remove: (imagePath: string) => Promise<void>
  patch: (body: UpdateDonationPageData) => Promise<unknown>
}

async function bestEffortRemove(
  remove: (imagePath: string) => Promise<void>,
  imagePath: string,
): Promise<void> {
  try {
    await remove(imagePath)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn("[storage] Failed to remove donation page image:", message)
  }
}

/**
 * Persist donation page settings with safe image lifecycle ordering:
 * - Replace: upload new → PATCH path → best-effort delete previous (rollback new upload if PATCH fails)
 * - Remove: PATCH null → best-effort delete previous (never delete if PATCH fails)
 * - No image change: PATCH payload only
 */
export async function saveDonationPageWithImageChanges(params: {
  userId: string
  payload: UpdateDonationPageData
  pendingFile?: File
  removeExisting: boolean
  previousImagePath: string | null
  deps: DonationPageImageSaveDeps
}): Promise<void> {
  const { userId, payload, pendingFile, removeExisting, previousImagePath, deps } = params

  if (pendingFile) {
    const newPath = await deps.upload(userId, pendingFile)

    try {
      await deps.patch({
        ...payload,
        donation_page_image_path: newPath,
      })
    } catch (error) {
      await bestEffortRemove(deps.remove, newPath)
      throw error
    }

    if (previousImagePath && previousImagePath !== newPath) {
      await bestEffortRemove(deps.remove, previousImagePath)
    }
    return
  }

  if (removeExisting) {
    await deps.patch({
      ...payload,
      donation_page_image_path: null,
    })

    if (previousImagePath) {
      await bestEffortRemove(deps.remove, previousImagePath)
    }
    return
  }

  await deps.patch(payload)
}
