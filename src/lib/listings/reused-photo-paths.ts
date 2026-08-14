import type { PhotoInput } from "@/features/events/server/repository-types"

export function getReusedExistingPhotoPaths(
  existingPhotoPaths: string[],
  submittedPhotos?: PhotoInput[]
): string[] {
  const existingPhotoPathSet = new Set(existingPhotoPaths.filter(Boolean))
  const submittedPaths = (submittedPhotos ?? []).map((p) => p.path).filter(Boolean)
  return [...new Set(submittedPaths.filter((path) => existingPhotoPathSet.has(path)))]
}
