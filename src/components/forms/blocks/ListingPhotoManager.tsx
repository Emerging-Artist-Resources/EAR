"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { ListingStatus } from "@/features/events/server/repository-types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Text } from "@/components/ui/typography"
import { compressListingImage } from "@/lib/listings/compress-listing-image"
import {
  getExistingImageBucketOrder,
  resolveExistingImageUrl,
  transitionExistingImageOnError,
  type ExistingImageBucket,
  type ImageState,
} from "@/lib/listings/existing-image-resolution"
import {
  getListingPhotoRemainingSlots,
  LISTING_PHOTO_MAX,
  newListingPhotoKey,
  removeListingPhotoAt,
  setListingPhotoAsCover,
  takeFilesForRemainingSlots,
  type ListingPhotoDraftItem,
} from "@/lib/listings/listing-photo-draft"
import { supabase } from "@/lib/supabase/client"

type ListingPhotoManagerProps = {
  items: ListingPhotoDraftItem[]
  onChange: (next: ListingPhotoDraftItem[]) => void
  listingStatus?: ListingStatus | null
  label?: string
  description?: string
  max?: number
}

function logExistingImage(
  event: string,
  details: {
    path: string
    listingStatus?: ListingStatus | null
    primaryBucket: ExistingImageBucket
    fallbackBucket: ExistingImageBucket
    error?: unknown
  }
) {
  console.error(event, details)
}

export function ListingPhotoManager({
  items,
  onChange,
  listingStatus,
  label = "Promotional Images",
  description = "The first image is the listing display image. You can keep, remove, or add images (up to 5 total).",
  max = LISTING_PHOTO_MAX,
}: ListingPhotoManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const managedPreviewUrlsRef = useRef(new Set<string>())
  const resolvingFallbackRef = useRef(new Set<string>())
  const [processing, setProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [existingImageStates, setExistingImageStates] = useState<Record<string, ImageState>>({})
  const existingImageStatesRef = useRef(existingImageStates)
  existingImageStatesRef.current = existingImageStates

  const buckets = useMemo(() => getExistingImageBucketOrder(listingStatus), [listingStatus])
  const existingPaths = useMemo(
    () => items.filter((item): item is Extract<ListingPhotoDraftItem, { kind: "existing" }> => item.kind === "existing").map((item) => item.path),
    [items]
  )
  const remainingSlots = getListingPhotoRemainingSlots(items, max)

  // ListingPhotoManager is the only owner of object URL create/revoke.
  useEffect(() => {
    return () => {
      for (const url of managedPreviewUrlsRef.current) {
        URL.revokeObjectURL(url)
      }
      managedPreviewUrlsRef.current.clear()
    }
  }, [])

  useEffect(() => {
    const livePreviewUrls = new Set(
      items.filter((item): item is Extract<ListingPhotoDraftItem, { kind: "new" }> => item.kind === "new").map((item) => item.previewUrl)
    )
    for (const url of managedPreviewUrlsRef.current) {
      if (!livePreviewUrls.has(url)) {
        URL.revokeObjectURL(url)
        managedPreviewUrlsRef.current.delete(url)
      }
    }
  }, [items])

  useEffect(() => {
    if (!existingPaths.length) {
      setExistingImageStates({})
      return
    }
    let cancelled = false
    const run = async () => {
      const next: Record<string, ImageState> = {}
      for (const path of existingPaths) {
        if (cancelled) return
        try {
          const url = await resolveExistingImageUrl(supabase, buckets.primary, path)
          next[path] = { url, fallbackAttempted: false, hidden: false }
        } catch (error) {
          logExistingImage("existing_image_preferred_load_failed", {
            path,
            listingStatus,
            primaryBucket: buckets.primary,
            fallbackBucket: buckets.fallback,
            error,
          })
          try {
            const url = await resolveExistingImageUrl(supabase, buckets.fallback, path)
            next[path] = { url, fallbackAttempted: true, hidden: false }
          } catch (fallbackError) {
            logExistingImage("existing_image_fallback_resolution_failed", {
              path,
              listingStatus,
              primaryBucket: buckets.primary,
              fallbackBucket: buckets.fallback,
              error: fallbackError,
            })
            next[path] = { url: "", fallbackAttempted: true, hidden: true }
          }
        }
      }
      if (!cancelled) setExistingImageStates(next)
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [existingPaths.join("|"), buckets.primary, buckets.fallback, listingStatus])

  const handleExistingImageError = useCallback(
    async (path: string) => {
      const current = existingImageStatesRef.current[path]
      if (!current || current.hidden) return

      const action = transitionExistingImageOnError(current)
      if (action.type === "hide") {
        if (resolvingFallbackRef.current.has(path)) return
        logExistingImage("existing_image_fallback_load_failed", {
          path,
          listingStatus,
          primaryBucket: buckets.primary,
          fallbackBucket: buckets.fallback,
        })
        setExistingImageStates((prev) => {
          const image = prev[path]
          if (!image) return prev
          return { ...prev, [path]: { ...image, hidden: true } }
        })
        return
      }

      resolvingFallbackRef.current.add(path)
      setExistingImageStates((prev) => {
        const image = prev[path]
        if (!image) return prev
        return { ...prev, [path]: { ...image, fallbackAttempted: true } }
      })

      logExistingImage("existing_image_preferred_load_failed", {
        path,
        listingStatus,
        primaryBucket: buckets.primary,
        fallbackBucket: buckets.fallback,
      })

      try {
        const url = await resolveExistingImageUrl(supabase, buckets.fallback, path)
        setExistingImageStates((prev) => {
          const image = prev[path]
          if (!image || image.hidden || !image.fallbackAttempted) return prev
          resolvingFallbackRef.current.delete(path)
          return { ...prev, [path]: { ...image, url } }
        })
      } catch (error) {
        resolvingFallbackRef.current.delete(path)
        logExistingImage("existing_image_fallback_resolution_failed", {
          path,
          listingStatus,
          primaryBucket: buckets.primary,
          fallbackBucket: buckets.fallback,
          error,
        })
        setExistingImageStates((prev) => {
          const image = prev[path]
          if (!image) return prev
          return { ...prev, [path]: { ...image, hidden: true } }
        })
      }
    },
    [buckets.fallback, buckets.primary, listingStatus]
  )

  const addFiles = async (fileList: FileList | null) => {
    if (!fileList || processing) return

    const slots = getListingPhotoRemainingSlots(items, max)
    if (slots <= 0) return

    // Cap before compression so overflow files are never processed.
    const candidates = takeFilesForRemainingSlots(Array.from(fileList), slots)
    setProcessing(true)
    setErrorMessage(null)

    const toAdd: ListingPhotoDraftItem[] = []
    const errors: string[] = []

    try {
      for (const file of candidates) {
        if (!file.type.startsWith("image/")) {
          errors.push(`${file.name} is not an image file`)
          continue
        }
        try {
          const compressed = await compressListingImage(file)
          const previewUrl = URL.createObjectURL(compressed)
          managedPreviewUrlsRef.current.add(previewUrl)
          toAdd.push({
            key: newListingPhotoKey(),
            kind: "new",
            file: compressed,
            previewUrl,
          })
        } catch (err) {
          errors.push(err instanceof Error ? err.message : `Failed to process ${file.name}`)
        }
      }

      if (toAdd.length > 0) {
        onChange([...items, ...toAdd])
      }
      if (errors.length > 0) {
        setErrorMessage(errors.join("; "))
      }
    } finally {
      setProcessing(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const handleRemove = (index: number) => {
    const item = items[index]
    if (item?.kind === "new") {
      URL.revokeObjectURL(item.previewUrl)
      managedPreviewUrlsRef.current.delete(item.previewUrl)
    }
    onChange(removeListingPhotoAt(items, index))
    if (items.length <= 1) setErrorMessage(null)
  }

  const handleSetCover = (index: number) => {
    onChange(setListingPhotoAsCover(items, index))
  }

  const disabled = processing || remainingSlots <= 0

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      {description && <Text className="text-xs text-gray-500 mb-1">{description}</Text>}

      <Card
        className={`p-4 border-dashed border-2 ${
          errorMessage ? "border-error-600" : "border-gray-400"
        } bg-ear-off-white`}
      >
        {items.length > 0 && (
          <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.map((item, index) => {
              const previewSrc =
                item.kind === "new"
                  ? item.previewUrl
                  : existingImageStates[item.path]?.hidden
                    ? ""
                    : existingImageStates[item.path]?.url || ""
              const isCover = index === 0

              return (
                <div
                  key={item.key}
                  className="relative rounded-md border border-gray-200 overflow-hidden bg-white"
                >
                  {previewSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewSrc}
                      alt=""
                      className="h-24 w-full object-cover"
                      onError={() => {
                        if (item.kind === "existing") void handleExistingImageError(item.path)
                      }}
                    />
                  ) : (
                    <div className="h-24 w-full bg-gray-100" />
                  )}

                  <div className="absolute top-1 left-1">
                    {isCover ? (
                      <Badge variant="primary" size="sm">
                        Cover
                      </Badge>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="px-2 py-0 h-7 text-xs bg-white/90"
                        onClick={() => handleSetCover(index)}
                        disabled={processing}
                      >
                        Set as cover
                      </Button>
                    )}
                  </div>

                  <div className="absolute top-1 right-1">
                    <Button
                      variant="destructive"
                      size="sm"
                      type="button"
                      onClick={() => handleRemove(index)}
                      className="px-2 py-0"
                      disabled={processing}
                    >
                      X
                    </Button>
                  </div>

                  <div className="p-2">
                    <Text className="text-xs text-gray-600 truncate">
                      {item.kind === "new" ? item.file.name : "Saved image"}
                    </Text>
                    {item.kind === "new" && (
                      <Text className="text-xs text-gray-400">
                        {(item.file.size / 1024 / 1024).toFixed(2)}MB
                      </Text>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div
          className="rounded-md bg-ear-off-white p-6 text-center"
          onDragOver={(e) => e.preventDefault()}
          onDrop={async (e) => {
            e.preventDefault()
            await addFiles(e.dataTransfer.files)
          }}
        >
          <Text className="text-gray-700">
            {items.length === 0
              ? "Click to upload photos or drag and drop"
              : remainingSlots > 0
                ? `Add more photos (${remainingSlots} remaining)`
                : "Maximum of 5 images reached"}
          </Text>
          <Text className="text-xs text-gray-500">
            Up to {max} images, optimized for web (~5MB each max)
          </Text>

          <div className="mt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
            >
              {processing ? "Processing..." : "Choose Files"}
            </Button>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={async (e) => {
              await addFiles(e.target.files)
            }}
            disabled={disabled}
          />
        </div>
      </Card>

      {errorMessage && <Text className="text-xs text-error-600">{errorMessage}</Text>}
    </div>
  )
}
