import type { SupabaseClient } from "@supabase/supabase-js"
import type { ListingStatus } from "@/features/events/server/repository-types"
import { storageService } from "@/services/storage"

export const PRIVATE_EVENT_PHOTOS_BUCKET = "event-photos"
export const PUBLIC_EVENT_PHOTOS_BUCKET = "event-photos-public"

export type ExistingImageBucket =
  | typeof PRIVATE_EVENT_PHOTOS_BUCKET
  | typeof PUBLIC_EVENT_PHOTOS_BUCKET

export type ImageState = {
  url: string
  fallbackAttempted: boolean
  hidden: boolean
}

export type ImageErrorAction = { type: "resolve_fallback" } | { type: "hide" }

const SIGNED_URL_TTL_SECONDS = 3600
const MAX_EXISTING_IMAGES = 5

export function toListingStatus(status: string | null | undefined): ListingStatus | null {
  if (status === "pending" || status === "approved" || status === "rejected" || status === "draft") {
    return status
  }
  return null
}

export function getExistingImageBucketOrder(listingStatus?: ListingStatus | null): {
  primary: ExistingImageBucket
  fallback: ExistingImageBucket
} {
  if (listingStatus === "approved") {
    return {
      primary: PUBLIC_EVENT_PHOTOS_BUCKET,
      fallback: PRIVATE_EVENT_PHOTOS_BUCKET,
    }
  }
  return {
    primary: PRIVATE_EVENT_PHOTOS_BUCKET,
    fallback: PUBLIC_EVENT_PHOTOS_BUCKET,
  }
}

export function transitionExistingImageOnError(
  state: Pick<ImageState, "fallbackAttempted" | "hidden">
): ImageErrorAction {
  if (state.hidden || state.fallbackAttempted) {
    return { type: "hide" }
  }
  return { type: "resolve_fallback" }
}

export function uniqueExistingImagePaths(paths: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const path of paths) {
    if (!path) continue
    if (seen.has(path)) continue
    seen.add(path)
    out.push(path)
    if (out.length >= MAX_EXISTING_IMAGES) break
  }
  return out
}

export async function resolveExistingImageUrl(
  client: SupabaseClient,
  bucket: ExistingImageBucket,
  path: string
): Promise<string> {
  if (bucket === PUBLIC_EVENT_PHOTOS_BUCKET) {
    return storageService.getPublicUrl(client, bucket, path)
  }
  return storageService.createSignedUrl(client, bucket, path, SIGNED_URL_TTL_SECONDS)
}
