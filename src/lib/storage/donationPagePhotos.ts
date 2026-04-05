import { getSupabaseServerClient } from "@/lib/supabase/server"
import { storageService } from "@/services/storage"

/** Public bucket; must allow anonymous read for logged-out donors. See runbook. */
export const DONATION_PAGE_PHOTOS_BUCKET = "donation-page-photos"

export async function donationPageImagePublicUrl(imagePath: string): Promise<string> {
  const supabase = await getSupabaseServerClient()
  return storageService.getPublicUrl(supabase, DONATION_PAGE_PHOTOS_BUCKET, imagePath)
}
