import { supabase } from "@/lib/supabase/client"
import { storageService } from "@/services/storage"
import {
  ANNOUNCEMENT_PHOTOS_BUCKET,
  announcementPhotoPathFromPublicUrl,
  createAnnouncementImageStoragePath,
} from "@/lib/storage/announcementPhotoPaths"

/** Upload a cropped announcement image. Returns the public URL stored on the announcement. */
export async function uploadAnnouncementImage(file: File): Promise<string> {
  const path = createAnnouncementImageStoragePath()

  await storageService.uploadFile(supabase, ANNOUNCEMENT_PHOTOS_BUCKET, path, file, {
    upsert: false,
  })

  return storageService.getPublicUrl(supabase, ANNOUNCEMENT_PHOTOS_BUCKET, path)
}

/** Best-effort delete. No-ops when the URL is not an object in this bucket. */
export async function removeAnnouncementImageByPublicUrl(imageUrl: string): Promise<void> {
  const path = announcementPhotoPathFromPublicUrl(imageUrl)
  if (!path) return

  const { error } = await supabase.storage.from(ANNOUNCEMENT_PHOTOS_BUCKET).remove([path])
  if (error) {
    console.warn("[storage] Failed to remove announcement image:", error.message)
  }
}
