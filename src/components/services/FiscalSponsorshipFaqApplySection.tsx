import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FISCAL_SPONSORSHIP_INQUIRY_HREF } from "@/lib/content/fiscal-sponsorship"
import { DOCUMENTATION_SERVICE_IMAGE_SIZES, MARKETING_IMAGE_QUALITY } from "@/lib/images"
import { cn } from "@/lib/utils"

type FiscalSponsorshipFaqApplySectionProps = {
  title: string
  buttonLabel: string
  imageSrc: string
  imageAlt: string
  inquiryHref?: string
  className?: string
}

function ApplyImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative aspect-[16/9] w-full bg-secondary-50 lg:aspect-auto lg:min-h-[28rem] lg:h-full">
      <Image
        src={src}
        alt={alt}
        fill
        quality={MARKETING_IMAGE_QUALITY}
        className="object-cover object-center"
        sizes={DOCUMENTATION_SERVICE_IMAGE_SIZES}
      />
    </div>
  )
}

export function FiscalSponsorshipFaqApplySection({
  title,
  buttonLabel,
  imageSrc,
  imageAlt,
  inquiryHref = FISCAL_SPONSORSHIP_INQUIRY_HREF,
  className,
}: FiscalSponsorshipFaqApplySectionProps) {
  return (
    <section
      className={cn(className)}
      aria-labelledby="fiscal-sponsorship-faq-apply-heading"
    >
      <div className="grid lg:grid-cols-2 lg:items-stretch">
        <div className="flex flex-col justify-center gap-4 bg-secondary-50 px-4 py-8 sm:gap-6 sm:px-10 sm:py-12 lg:px-14 lg:py-16">
          <h2
            id="fiscal-sponsorship-faq-apply-heading"
            className="font-header text-2xl font-bold tracking-tight text-ear-black sm:text-3xl md:text-4xl"
          >
            {title}
          </h2>
          <div>
            <Button
              asChild
              className="h-auto w-full rounded-none bg-ear-black px-8 py-4 text-xs font-semibold uppercase tracking-widest text-ear-off-white hover:bg-ear-black/90 sm:w-auto"
            >
              <Link href={inquiryHref}>{buttonLabel}</Link>
            </Button>
          </div>
        </div>
        <ApplyImage src={imageSrc} alt={imageAlt} />
      </div>
    </section>
  )
}
