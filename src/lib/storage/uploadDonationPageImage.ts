import { compressListingImage } from "@/lib/listings/compress-listing-image"
import { supabase } from "@/lib/supabase/client"
import { storageService } from "@/services/storage"
import {
  DONATION_PAGE_PHOTOS_BUCKET,
  donationPageImageStoragePath,
} from "@/lib/storage/donationPagePhotoPaths"

/** Compress and upload a donation page hero image; returns the storage path for DB persistence. */
export async function uploadDonationPageImage(userId: string, file: File): Promise<string> {
  const compressed = await compressListingImage(file)
  const path = donationPageImageStoragePath(userId)

  await storageService.uploadFile(supabase, DONATION_PAGE_PHOTOS_BUCKET, path, compressed, {
    cacheControl: "3600",
    upsert: true,
  })

  return path
}

/** Best-effort storage cleanup when the profile clears its hero image. */
export async function removeDonationPageImageFromStorage(userId: string): Promise<void> {
  const path = donationPageImageStoragePath(userId)
  const { error } = await supabase.storage.from(DONATION_PAGE_PHOTOS_BUCKET).remove([path])
  if (error) {
    console.warn("[storage] Failed to remove donation page image:", error.message)
  }
}
