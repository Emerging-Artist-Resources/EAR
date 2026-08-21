import { getSupabaseServerClient } from "@/lib/supabase/server"
import { storageService } from "@/services/storage"
import { DONATION_PAGE_PHOTOS_BUCKET } from "@/lib/storage/donationPagePhotoPaths"

export { DONATION_PAGE_PHOTOS_BUCKET } from "@/lib/storage/donationPagePhotoPaths"
export {
  createDonationPageImageStoragePath,
  isDonationPageImageStoragePathOwnedByUser,
  assertDonationPageImageStoragePathOwnedByUser,
} from "@/lib/storage/donationPagePhotoPaths"

export async function donationPageImagePublicUrl(imagePath: string): Promise<string> {
  const supabase = await getSupabaseServerClient()
  return storageService.getPublicUrl(supabase, DONATION_PAGE_PHOTOS_BUCKET, imagePath)
}
