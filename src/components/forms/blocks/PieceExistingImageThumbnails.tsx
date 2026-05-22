"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { storageService } from "@/services/storage"
import { ImageWithBlurredFill } from "@/components/shared/ImageWithBlurredFill"

const BUCKET = "event-photos"

export function PieceExistingImageThumbnails({ paths }: { paths: string[] }) {
  const [urls, setUrls] = useState<string[]>([])

  useEffect(() => {
    if (!paths.length) {
      setUrls([])
      return
    }
    let cancelled = false
    const run = async () => {
      const next: string[] = []
      for (const path of paths.slice(0, 5)) {
        if (!path) continue
        try {
          const url = await storageService.createSignedUrl(supabase, BUCKET, path, 3600)
          next.push(url)
        } catch {
          // ignore broken path
        }
      }
      if (!cancelled) setUrls(next)
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [paths.join("|")])

  if (!urls.length) return null

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      <p className="text-xs text-gray-600 w-full">Current images (upload new images below to replace)</p>
      {urls.map((src) => (
        <ImageWithBlurredFill
          key={src}
          src={src}
          alt=""
          className="rounded-md border border-gray-200"
          frameClassName="h-20 w-20"
        />
      ))}
    </div>
  )
}
