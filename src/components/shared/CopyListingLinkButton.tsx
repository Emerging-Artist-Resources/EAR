"use client"

import { useCallback, useEffect, useState } from "react"
import { Link2 } from "lucide-react"
import type { VariantProps } from "class-variance-authority"
import { Button, buttonVariants } from "@/components/ui/button"
import { getPublicAppUrl } from "@/lib/config/app-url"
import { getCalendarListingUrl } from "@/lib/config/constants"
import { isListingPubliclyShareable } from "@/lib/listings/shareable"

export function CopyListingLinkButton({
  listingId,
  status,
  size = "sm",
  className,
}: {
  listingId: string
  status?: string | null
  size?: VariantProps<typeof buttonVariants>["size"]
  className?: string
}) {
  const [copied, setCopied] = useState(false)
  const shareable = isListingPubliclyShareable(status)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  const handleCopy = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      const url = `${getPublicAppUrl()}${getCalendarListingUrl(listingId)}`
      try {
        await navigator.clipboard.writeText(url)
        setCopied(true)
      } catch {
        // Clipboard access can fail in unsupported or non-secure contexts.
      }
    },
    [listingId],
  )

  if (!shareable) return null

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      className={className}
      onClick={handleCopy}
      aria-label={copied ? "Link copied" : "Copy listing link"}
    >
      <Link2 />
      {copied ? "Copied" : "Share link"}
    </Button>
  )
}
