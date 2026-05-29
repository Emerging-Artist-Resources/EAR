import Image from "next/image"
import { Text } from "@/components/ui/typography"
import {
  DOCUMENTATION_BIO_SECTION_SIZES,
  MARKETING_IMAGE_QUALITY,
} from "@/lib/images"
import { cn } from "@/lib/utils"

type DocumentationBioSectionProps = {
  sectionTitle: string
  studioName: string
  paragraphs: readonly string[]
  backgroundSrc: string
  backgroundAlt: string
  className?: string
}

export function DocumentationBioSection({
  sectionTitle,
  studioName,
  paragraphs,
  backgroundSrc,
  backgroundAlt,
  className,
}: DocumentationBioSectionProps) {
  return (
    <section
      className={cn("relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8 lg:py-20", className)}
      aria-labelledby="documentation-bio-heading"
    >
      <Image
        src={backgroundSrc}
        alt={backgroundAlt}
        fill
        quality={MARKETING_IMAGE_QUALITY}
        className="object-cover object-center"
        sizes={DOCUMENTATION_BIO_SECTION_SIZES}
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-ear-black/45 via-ear-black/20 to-ear-black/55"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-7xl">
        <h2
          id="documentation-bio-heading"
          className="font-header mb-8 text-2xl font-bold uppercase tracking-wide text-ear-off-white sm:text-3xl"
        >
          {sectionTitle}
        </h2>

        <div className="max-w-2xl bg-white px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
          <p className="font-sans text-sm font-bold uppercase tracking-widest text-ear-dark-red sm:text-base">
            {studioName}
          </p>
          <div className="mt-6 space-y-4">
            {paragraphs.map((paragraph, i) => (
              <Text key={i} className="text-ear-black text-pretty text-base leading-relaxed">
                {paragraph}
              </Text>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
