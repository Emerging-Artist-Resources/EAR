"use client"

import { useEffect, useState } from "react"
import { hasDisplayText, hasSocialHandlesContent } from "@/lib/listing-display"

export { hasSocialHandlesContent }
import type { PublicListingDetail } from "./PublicListingDetailSections"

type ListingPhoto = NonNullable<PublicListingDetail["listing_photos"]>[number]

export function FieldBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-2">
      <div className="font-sans text-sm font-semibold text-text-primary">{label}</div>
      <div className="mt-0.5 font-sans text-sm text-text-primary">{children}</div>
    </div>
  )
}

export function HeroImageWithLightbox({
  photo,
  credit,
  creditLabel,
  ariaLabelPrefix = "performance",
}: {
  photo: ListingPhoto
  credit: string | null
  /** When set, shows a labeled line under the image (e.g. "Image credit"). */
  creditLabel?: string | null
  /** Used in aria-labels, e.g. "performance" or "piece". */
  ariaLabelPrefix?: string
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false)

  useEffect(() => {
    if (!lightboxOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightboxOpen])

  if (!photo.url) return null

  const imageLabel = ariaLabelPrefix === "piece" ? "piece image" : "performance image"

  return (
    <>
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="block w-full cursor-pointer overflow-hidden rounded-md border border-border-default text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        aria-label={credit ? `View image: ${credit}` : `View ${imageLabel}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt={credit || imageLabel}
          className="aspect-[3/4] w-full object-cover"
        />
      </button>
      {hasDisplayText(credit) && (
        <p className="mt-2 font-sans text-sm text-text-muted">
          {hasDisplayText(creditLabel) ? (
            <>
              <span className="font-semibold text-text-primary">{creditLabel}: </span>
              {credit}
            </>
          ) : (
            credit
          )}
        </p>
      )}

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-ear-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Expanded ${imageLabel}`}
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-md bg-ear-off-white/10 px-3 py-1.5 font-sans text-sm text-ear-off-white hover:bg-ear-off-white/20"
            onClick={() => setLightboxOpen(false)}
          >
            Close
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.url}
            alt={credit || imageLabel}
            className="max-h-[90vh] max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
