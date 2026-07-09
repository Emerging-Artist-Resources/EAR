"use client"

import { useEffect, useMemo, useState } from "react"
import { Muted } from "@/components/ui/typography"
import { stack } from "@/lib/spacing"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase/client"
import { storageService } from "@/services/storage"

const BUCKET = "event-photos"

export function PieceExistingImageThumbnails({ paths }: { paths: string[] }) {
  const pathsKey = useMemo(() => paths.join("|"), [paths])
  const [fetchedUrls, setFetchedUrls] = useState<string[]>([])

  useEffect(() => {
    if (!paths.length) return

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
      if (!cancelled) setFetchedUrls(next)
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [pathsKey, paths])

  const urls = paths.length ? fetchedUrls : []
  if (!urls.length) return null

  return (
    <div className={cn(stack.xs, "flex flex-wrap gap-2")}>
      <Muted className="w-full">
        Current images (upload new images below to replace)
      </Muted>
      {urls.map((src) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          className="h-20 w-20 rounded-md border border-border object-cover"
        />
      ))}
    </div>
  )
}
