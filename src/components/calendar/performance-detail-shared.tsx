"use client"

import { useEffect, useState } from "react"
import { ClampableText } from "@/components/calendar/ClampableText"
import { H3, Text } from "@/components/ui/typography"
import { hasDisplayText, hasSocialHandlesContent } from "@/lib/listings/display"
import { cn } from "@/lib/utils"

export { hasSocialHandlesContent }
import type { PublicListingDetail } from "./PublicListingDetailSections"

type ListingPhoto = NonNullable<PublicListingDetail["listing_photos"]>[number]

export function ListingTitleGroup({
  title,
  subtitle,
  subtitleLabel,
}: {
  title?: string
  subtitle?: string
  /** When set, renders "Label: value". When omitted, subtitle is plain text under the title. */
  subtitleLabel?: string
}) {
  const showTitle = hasDisplayText(title)
  const showSubtitle = hasDisplayText(subtitle)
  if (!showTitle && !showSubtitle) return null

  return (
    <div className="space-y-2 py-2">
      {showTitle && (
        <H3 className="font-header text-2xl leading-none text-brand-primary">{title}</H3>
      )}
      {showSubtitle && (
        <Text className="font-sans text-sm leading-snug text-text-primary">
          {subtitleLabel ? (
            <>
              <span className="font-semibold">{formatFieldLabel(subtitleLabel)}</span> {subtitle}
            </>
          ) : (
            subtitle
          )}
        </Text>
      )}
    </div>
  )
}

export function ApplicationFeeRow({
  feeAmount,
  className,
}: {
  feeAmount: string | null | undefined
  className?: string
}) {
  const amount = feeAmount?.trim() ?? ""
  if (amount) {
    return (
      <InlineLabelRow label="Application Fee" className={className}>
        {amount}
      </InlineLabelRow>
    )
  }
  return (
    <p className={cn("py-2 font-sans text-sm font-bold leading-6 text-text-primary", className)}>
      No Application Fee
    </p>
  )
}

export function formatFieldLabel(label: string): string {
  return label.endsWith(":") ? label : `${label}:`
}

export const detailLinkClass =
  "text-brand-primary hover:text-brand-primary-hover underline break-all"

export function ListingBodyText({
  text,
  className,
  clampClassName = "line-clamp-4",
}: {
  text: string
  className?: string
  clampClassName?: string
}) {
  return <ClampableText text={text} className={className} clampClassName={clampClassName} />
}

export function InlineLabelRow({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <p className={cn("min-w-0 max-w-full py-2 font-sans text-sm leading-6 text-text-primary [overflow-wrap:anywhere]", className)}>
      <span className="font-semibold">{formatFieldLabel(label)}</span>{" "}
      <span className="min-w-0 [overflow-wrap:anywhere]">{children}</span>
    </p>
  )
}

/** Left accent bar panel — matches Dates & Times occurrence cards. */
export function DetailAccentPanel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "min-w-0 max-w-full overflow-hidden space-y-4 rounded-r border-l-4 border-brand-primary bg-surface-panel py-2 pl-4",
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Bordered section card — matches Dates & Times outer wrapper. */
export function DetailSectionCard({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("space-y-3 border-b border-border-default pb-6", className)}>
      <H3 className="text-brand-primary">{title}</H3>
      <div className="min-w-0 max-w-full overflow-hidden space-y-4 rounded-md border border-border-default bg-surface-panel p-4">
        {children}
      </div>
    </section>
  )
}

export function InlineWebsiteLink({ href, label = "Website" }: { href: string; label?: string }) {
  const url = href.trim()
  if (!url) return null
  return (
    <InlineLabelRow label={label}>
      <a className={detailLinkClass} href={url} target="_blank" rel="noopener noreferrer">
        {url}
      </a>
    </InlineLabelRow>
  )
}

export function FieldBlock({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("py-2", className)}>
      <div className="font-sans text-sm font-semibold text-text-primary">{formatFieldLabel(label)}</div>
      <div className="mt-0.5 min-w-0 max-w-full font-sans text-sm text-text-primary">{children}</div>
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

  const imageLabel =
    ariaLabelPrefix === "piece"
      ? "piece image"
      : ariaLabelPrefix === "workshop"
        ? "workshop image"
        : ariaLabelPrefix === "class"
          ? "class image"
          : ariaLabelPrefix === "audition"
            ? "audition image"
            : ariaLabelPrefix === "opportunity"
              ? "opportunity image"
              : "performance image"

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
