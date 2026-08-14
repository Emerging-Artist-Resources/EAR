"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { ListingStatus } from "@/features/events/server/repository-types"
import {
  getExistingImageBucketOrder,
  resolveExistingImageUrl,
  transitionExistingImageOnError,
  uniqueExistingImagePaths,
  type ExistingImageBucket,
  type ImageState,
} from "@/lib/listings/existing-image-resolution"
import { supabase } from "@/lib/supabase/client"

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

export function PieceExistingImageThumbnails({
  paths,
  listingStatus,
}: {
  paths: string[]
  listingStatus?: ListingStatus | null
}) {
  const uniquePaths = useMemo(() => uniqueExistingImagePaths(paths), [paths.join("|")])
  const buckets = useMemo(() => getExistingImageBucketOrder(listingStatus), [listingStatus])
  const [imageStates, setImageStates] = useState<Record<string, ImageState>>({})
  const imageStatesRef = useRef(imageStates)
  imageStatesRef.current = imageStates
  const resolvingFallbackRef = useRef(new Set<string>())

  useEffect(() => {
    if (!uniquePaths.length) {
      setImageStates({})
      return
    }
    let cancelled = false
    const run = async () => {
      const next: Record<string, ImageState> = {}
      for (const path of uniquePaths) {
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
      if (!cancelled) setImageStates(next)
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [uniquePaths.join("|"), buckets.primary, buckets.fallback, listingStatus])

  const handleError = useCallback(
    async (path: string) => {
      const current = imageStatesRef.current[path]
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
        setImageStates((prev) => {
          const image = prev[path]
          if (!image) return prev
          return { ...prev, [path]: { ...image, hidden: true } }
        })
        return
      }

      resolvingFallbackRef.current.add(path)
      setImageStates((prev) => {
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
        setImageStates((prev) => {
          const image = prev[path]
          if (!image || image.hidden || !image.fallbackAttempted) {
            return prev
          }
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
        setImageStates((prev) => {
          const image = prev[path]
          if (!image) return prev
          return { ...prev, [path]: { ...image, hidden: true } }
        })
      }
    },
    [buckets.fallback, buckets.primary, listingStatus]
  )

  const visible = uniquePaths
    .map((path) => {
      const state = imageStates[path]
      if (!state || state.hidden || !state.url) return null
      return { path, url: state.url }
    })
    .filter((item): item is { path: string; url: string } => item != null)

  if (!visible.length) return null

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      <p className="text-xs text-gray-600 w-full">Current images (upload new images below to replace)</p>
      {visible.map(({ path, url }) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={path}
          src={url}
          alt=""
          className="h-20 w-20 rounded-md object-cover border border-gray-200"
          onError={() => {
            void handleError(path)
          }}
        />
      ))}
    </div>
  )
}
