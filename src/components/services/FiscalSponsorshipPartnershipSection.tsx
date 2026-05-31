import Image from "next/image"
import { Text } from "@/components/ui/typography"
import { cn } from "@/lib/utils"

type FiscalSponsorshipPartnershipSectionProps = {
  paragraphs: readonly string[]
  imageSrc: string
  imageAlt: string
  className?: string
}

export function FiscalSponsorshipPartnershipSection({
  paragraphs,
  imageSrc,
  imageAlt,
  className,
}: FiscalSponsorshipPartnershipSectionProps) {
  return (
    <section
      className={cn("relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8 lg:py-24", className)}
      aria-labelledby="fiscal-sponsorship-partnership-heading"
    >
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        className="object-cover object-center"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-ear-black/20" aria-hidden />

      <div className="relative z-10 mx-auto max-w-4xl">
        <div className="bg-ear-black px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-16">
          <h2 id="fiscal-sponsorship-partnership-heading" className="sr-only">
            EAR partnership with mignolo
          </h2>
          <div className="space-y-5">
            {paragraphs.map((paragraph, i) => (
              <Text key={i} className="text-pretty text-base leading-relaxed text-ear-off-white">
                {paragraph}
              </Text>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
