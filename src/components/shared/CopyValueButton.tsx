"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

type CopyValueButtonProps = {
  value: string
  idleLabel?: string
  copiedLabel?: string
  className?: string
}

export function CopyValueButton({
  value,
  idleLabel = "Copy",
  copiedLabel = "Copied",
  className,
}: CopyValueButtonProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
    } catch {
      // Clipboard access can fail in unsupported or non-secure contexts.
    }
  }, [value])

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      onClick={() => void handleCopy()}
    >
      {copied ? copiedLabel : idleLabel}
    </Button>
  )
}
