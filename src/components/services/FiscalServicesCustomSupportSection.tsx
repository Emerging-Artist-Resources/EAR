import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/typography"
import { FISCAL_SERVICES_INQUIRY_HREF } from "@/lib/content/fiscal-services"
import { DOCUMENTATION_BIO_SECTION_SIZES, MARKETING_IMAGE_QUALITY } from "@/lib/images"
import { cn } from "@/lib/utils"

type FiscalServicesCustomSupportSectionProps = {
  title: string
  body: string
  actionLabel: string
  backgroundSrc: string
  backgroundAlt: string
  inquiryHref?: string
  className?: string
}

export function FiscalServicesCustomSupportSection({
  title,
  body,
  actionLabel,
  backgroundSrc,
  backgroundAlt,
  inquiryHref = FISCAL_SERVICES_INQUIRY_HREF,
  className,
}: FiscalServicesCustomSupportSectionProps) {
  return (
    <section
      className={cn("relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8 lg:py-24", className)}
      aria-labelledby="fiscal-services-custom-support-heading"
    >
      <Image
        src={backgroundSrc}
        alt={backgroundAlt}
        fill
        quality={MARKETING_IMAGE_QUALITY}
        className="object-cover object-center"
        sizes={DOCUMENTATION_BIO_SECTION_SIZES}
      />
      <div className="absolute inset-0 bg-ear-black/25" aria-hidden />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="flex max-w-sm flex-col justify-center bg-ear-off-white px-8 py-16 text-center sm:px-10 sm:py-20 lg:py-24">
          <h2
            id="fiscal-services-custom-support-heading"
            className="font-header text-2xl font-bold tracking-tight text-ear-black sm:text-3xl"
          >
            {title}
          </h2>
          <Text className="mt-6 text-pretty text-base leading-relaxed text-ear-black">{body}</Text>
          <div className="mt-10">
            <Button
              asChild
              className="h-auto rounded-none bg-ear-black px-10 py-4 text-xs font-semibold uppercase tracking-widest text-ear-off-white hover:bg-ear-black/90"
            >
              <Link href={inquiryHref}>{actionLabel}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
