import { getSupabaseServiceClient } from "@/lib/supabase/service"
import { storageService } from "@/services/storage"

/** First photo by sort_order; public bucket URLs for approved listings. */
export function getCoverPhotoPublic(
  photos: Array<{ path: string; sort_order?: number; credit?: string | null }> | null | undefined
): { url: string; credit: string | null } | null {
  if (!photos?.length) return null
  const sorted = [...photos].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  const first = sorted[0]
  if (!first?.path) return null
  const svc = getSupabaseServiceClient()
  return {
    url: storageService.getPublicUrl(svc, "event-photos-public", first.path),
    credit: first.credit ?? null,
  }
}
