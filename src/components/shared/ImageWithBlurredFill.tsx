"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

export type ImageWithBlurredFillProps = {
  src: string
  alt: string
  /** Outer wrapper (border, margin, rounded corners on the frame). */
  className?: string
  /** Inner frame sizing (aspect ratio, height, width). */
  frameClassName?: string
  blurClassName?: string
  foregroundClassName?: string
  onError?: () => void
  onLoad?: () => void
  /** When true, renders nothing after the foreground image fails to load. */
  hideOnError?: boolean
}

/**
 * Shows the full image with original aspect ratio (object-contain) inside a fixed frame,
 * filling letterbox/pillarbox space with a blurred, scaled copy of the same image.
 */
export function ImageWithBlurredFill({
  src,
  alt,
  className,
  frameClassName,
  blurClassName = "scale-110 object-cover blur-2xl",
  foregroundClassName,
  onError,
  onLoad,
  hideOnError = false,
}: ImageWithBlurredFillProps) {
  const [failed, setFailed] = useState(false)

  if (failed && hideOnError) {
    return null
  }

  return (
    <div className={cn("overflow-hidden bg-gray-100", className)}>
      <div className={cn("relative w-full", frameClassName)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          aria-hidden
          className={cn("absolute inset-0 h-full w-full", blurClassName)}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className={cn("relative z-10 h-full w-full object-contain", foregroundClassName)}
          onError={() => {
            setFailed(true)
            onError?.()
          }}
          onLoad={() => {
            setFailed(false)
            onLoad?.()
          }}
        />
      </div>
    </div>
  )
}
