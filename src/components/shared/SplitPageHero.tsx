import Image from "next/image"
import { H1, Text } from "@/components/ui/typography"
import {
  MARKETING_IMAGE_QUALITY,
  SPLIT_PAGE_HERO_IMAGE_SIZES,
} from "@/lib/images"
import {
  PAGE_HERO_ACTIONS_CLASS,
  PAGE_HERO_BODY_CLASS,
  PAGE_HERO_BODY_STACK_CLASS,
  PAGE_HERO_CONTENT_PADDING_CLASS,
  PAGE_HERO_GRID_CLASS,
  PAGE_HERO_HEIGHT_CLASS,
  PAGE_HERO_LEAD_CLASS,
  PAGE_HERO_SPLIT_CONTENT_CLASS,
  PAGE_HERO_SPLIT_DESKTOP_IMAGE_CLASS,
  PAGE_HERO_SPLIT_MOBILE_OVERLAY_CLASS,
  PAGE_HERO_TAGLINE_CLASS,
  PAGE_HERO_TITLE_CLASS,
} from "@/lib/marketing/page-hero"
import { cn } from "@/lib/utils"

type SplitPageHeroProps = {
  headingId: string
  title: string
  imageSrc: string
  imageAlt?: string
  imagePosition?: "left" | "right"
  imageObjectPosition?: string
  tagline?: string
  /** Allows the section to grow with long copy (e.g. About Us). */
  growWithContent?: boolean
  className?: string
  children?: React.ReactNode
}

export function SplitPageHero({
  headingId,
  title,
  imageSrc,
  imageAlt = "",
  imagePosition = "left",
  imageObjectPosition = "object-left",
  tagline,
  growWithContent = false,
  className,
  children,
}: SplitPageHeroProps) {
  const imageColumn = (
    <div
      className={cn(
        PAGE_HERO_SPLIT_DESKTOP_IMAGE_CLASS,
        growWithContent ? "lg:min-h-0" : "lg:min-h-full"
      )}
    >
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        priority
        quality={MARKETING_IMAGE_QUALITY}
        className={cn("object-cover", imageObjectPosition)}
        sizes={SPLIT_PAGE_HERO_IMAGE_SIZES}
      />
    </div>
  )

  const contentColumn = (
    <div className={cn(PAGE_HERO_SPLIT_CONTENT_CLASS, PAGE_HERO_CONTENT_PADDING_CLASS)}>
      <H1 id={headingId} className={PAGE_HERO_TITLE_CLASS}>
        {title}
      </H1>
      {tagline ? <p className={PAGE_HERO_TAGLINE_CLASS}>{tagline}</p> : null}
      {children}
    </div>
  )

  return (
    <section
      className={cn(PAGE_HERO_GRID_CLASS, PAGE_HERO_HEIGHT_CLASS, className)}
      aria-labelledby={headingId}
    >
      <div className="absolute inset-0 lg:hidden" aria-hidden>
        <Image
          src={imageSrc}
          alt=""
          fill
          priority
          quality={MARKETING_IMAGE_QUALITY}
          className={cn("object-cover opacity-90", imageObjectPosition)}
          sizes={SPLIT_PAGE_HERO_IMAGE_SIZES}
        />
        <div className={PAGE_HERO_SPLIT_MOBILE_OVERLAY_CLASS} />
      </div>

      {imagePosition === "left" ? (
        <>
          {imageColumn}
          {contentColumn}
        </>
      ) : (
        <>
          {contentColumn}
          {imageColumn}
        </>
      )}
    </section>
  )
}

type PageHeroParagraphsProps = {
  lead?: string
  paragraphs: readonly string[]
  className?: string
}

export function PageHeroParagraphs({
  lead,
  paragraphs,
  className,
}: PageHeroParagraphsProps) {
  return (
    <div className={cn(PAGE_HERO_BODY_STACK_CLASS, className)}>
      {lead ? <Text className={PAGE_HERO_LEAD_CLASS}>{lead}</Text> : null}
      {paragraphs.map((paragraph, index) => (
        <Text key={index} className={PAGE_HERO_BODY_CLASS}>
          {paragraph}
        </Text>
      ))}
    </div>
  )
}

export function PageHeroActions({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn(PAGE_HERO_ACTIONS_CLASS, className)}>{children}</div>
}
