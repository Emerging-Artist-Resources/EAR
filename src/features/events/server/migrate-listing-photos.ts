import type { SupabaseClient } from "@supabase/supabase-js"
import {
  PRIVATE_EVENT_PHOTOS_BUCKET,
  PUBLIC_EVENT_PHOTOS_BUCKET,
} from "@/lib/listings/existing-image-resolution"
import { storageService } from "@/services/storage"

export type PhotoMigrateStorage = {
  moveFile: (fromBucket: string, toBucket: string, path: string) => Promise<unknown>
  objectExists: (bucket: string, path: string) => Promise<boolean>
}

export type MigrateListingPhotosResult = {
  moved: string[]
  alreadyAtDestination: string[]
  failed: Array<{ path: string; error: unknown }>
}

function splitStoragePath(path: string): { folder: string; name: string } {
  const i = path.lastIndexOf("/")
  if (i === -1) return { folder: "", name: path }
  return { folder: path.slice(0, i), name: path.slice(i + 1) }
}

export async function supabaseObjectExists(
  client: SupabaseClient,
  bucket: string,
  path: string
): Promise<boolean> {
  const { folder, name } = splitStoragePath(path)
  const { data, error } = await client.storage.from(bucket).list(folder, {
    search: name,
    limit: 100,
  })
  if (error || !data) return false
  return data.some((entry) => entry.name === name)
}

export function createPhotoMigrateStorage(client: SupabaseClient): PhotoMigrateStorage {
  return {
    moveFile: (fromBucket, toBucket, path) => storageService.moveFile(client, fromBucket, toBucket, path),
    objectExists: (bucket, path) => supabaseObjectExists(client, bucket, path),
  }
}

export async function migrateReusedPhotosBestEffort(
  storage: PhotoMigrateStorage,
  paths: string[],
  buckets: { fromBucket: string; toBucket: string } = {
    fromBucket: PUBLIC_EVENT_PHOTOS_BUCKET,
    toBucket: PRIVATE_EVENT_PHOTOS_BUCKET,
  }
): Promise<MigrateListingPhotosResult> {
  const uniquePaths = [...new Set(paths.filter(Boolean))]
  const result: MigrateListingPhotosResult = {
    moved: [],
    alreadyAtDestination: [],
    failed: [],
  }

  for (const path of uniquePaths) {
    try {
      await storage.moveFile(buckets.fromBucket, buckets.toBucket, path)
      result.moved.push(path)
    } catch (error) {
      try {
        const atDestination = await storage.objectExists(buckets.toBucket, path)
        if (atDestination) {
          result.alreadyAtDestination.push(path)
          continue
        }
      } catch (existsError) {
        result.failed.push({ path, error: existsError })
        continue
      }
      result.failed.push({ path, error })
    }
  }

  return result
}

export function logMigrationSummary(result: MigrateListingPhotosResult): void {
  console.info("listing_photos_migrate_public_to_private", {
    moved: result.moved,
    alreadyAtDestination: result.alreadyAtDestination,
    failed: result.failed.map(({ path, error }) => ({
      path,
      error: error instanceof Error ? error.message : error,
    })),
  })
  for (const item of result.failed) {
    console.error("listing_photos_migrate_path_failed", {
      path: item.path,
      error: item.error,
    })
  }
}
