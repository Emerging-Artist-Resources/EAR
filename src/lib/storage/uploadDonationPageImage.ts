import { supabase } from "@/lib/supabase/client"
import { storageService } from "@/services/storage"
import {
  DONATION_PAGE_PHOTOS_BUCKET,
  createDonationPageImageStoragePath,
} from "@/lib/storage/donationPagePhotoPaths"

/**
 * Upload a donation page hero image (already compressed by PhotoUploader).
 * Returns the new storage path for DB persistence — does not mutate profile rows.
 */
export async function uploadDonationPageImage(userId: string, file: File): Promise<string> {
  const path = createDonationPageImageStoragePath(userId)

  await storageService.uploadFile(supabase, DONATION_PAGE_PHOTOS_BUCKET, path, file, {
    upsert: false,
  })

  return path
}

/** Best-effort delete of a donation page hero object by storage path. */
export async function removeDonationPageImageFromStorage(imagePath: string): Promise<void> {
  const { error } = await supabase.storage.from(DONATION_PAGE_PHOTOS_BUCKET).remove([imagePath])
  if (error) {
    console.warn("[storage] Failed to remove donation page image:", error.message)
  }
}
