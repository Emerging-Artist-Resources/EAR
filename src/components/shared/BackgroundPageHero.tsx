import Image from "next/image"
import { H1 } from "@/components/ui/typography"
import {
  MARKETING_IMAGE_QUALITY,
  SERVICES_HERO_IMAGE_SIZES,
} from "@/lib/images"
import {
  PAGE_HERO_BACKGROUND_IMAGE_CLASS,
  PAGE_HERO_BACKGROUND_OVERLAY_CLASS,
  PAGE_HERO_CENTERED_CONTENT_CLASS,
  PAGE_HERO_HEIGHT_CLASS,
  PAGE_HERO_TITLE_CLASS,
} from "@/lib/marketing/page-hero"
import { cn } from "@/lib/utils"

type BackgroundPageHeroProps = {
  headingId: string
  title: string
  imageSrc: string
  className?: string
  children?: React.ReactNode
}

export function BackgroundPageHero({
  headingId,
  title,
  imageSrc,
  className,
  children,
}: BackgroundPageHeroProps) {
  return (
    <section
      className={cn(
        "relative w-full overflow-hidden bg-ear-black",
        PAGE_HERO_HEIGHT_CLASS,
        className
      )}
      aria-labelledby={headingId}
    >
      <Image
        src={imageSrc}
        alt=""
        fill
        priority
        quality={MARKETING_IMAGE_QUALITY}
        className={PAGE_HERO_BACKGROUND_IMAGE_CLASS}
        sizes={SERVICES_HERO_IMAGE_SIZES}
      />
      <div className={PAGE_HERO_BACKGROUND_OVERLAY_CLASS} aria-hidden />
      <div className={cn(PAGE_HERO_CENTERED_CONTENT_CLASS, PAGE_HERO_HEIGHT_CLASS)}>
        <H1 id={headingId} className={PAGE_HERO_TITLE_CLASS}>
          {title}
        </H1>
        {children}
      </div>
    </section>
  )
}
