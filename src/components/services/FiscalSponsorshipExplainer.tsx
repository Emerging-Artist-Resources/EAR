import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/typography"
import { FISCAL_SPONSORSHIP_FAQ_HREF } from "@/lib/content/fiscal-sponsorship"
import { DOCUMENTATION_SERVICE_IMAGE_SIZES, MARKETING_IMAGE_QUALITY } from "@/lib/images"
import { cn } from "@/lib/utils"

type FiscalSponsorshipExplainerProps = {
  title: string
  body: string
  imageSrc: string
  imageAlt: string
  learnMoreHref?: string
  className?: string
}

export function FiscalSponsorshipExplainer({
  title,
  body,
  imageSrc,
  imageAlt,
  learnMoreHref = FISCAL_SPONSORSHIP_FAQ_HREF,
  className,
}: FiscalSponsorshipExplainerProps) {
  return (
    <section
      className={cn("bg-secondary-50 px-4 py-16 sm:px-6 lg:px-8 lg:py-20", className)}
      aria-labelledby="fiscal-sponsorship-explainer-heading"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 lg:grid-cols-2 lg:items-stretch">
        <div className="relative aspect-square w-full">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            quality={MARKETING_IMAGE_QUALITY}
            className="object-cover object-center"
            sizes={DOCUMENTATION_SERVICE_IMAGE_SIZES}
          />
        </div>

        <div className="flex flex-col gap-4 px-6 py-10 sm:px-10 lg:px-14 lg:py-12">
          <h2
            id="fiscal-sponsorship-explainer-heading"
            className="font-header text-3xl font-bold tracking-tight text-ear-black sm:text-4xl"
          >
            {title}
          </h2>
          <Text className="max-w-xl text-pretty text-base leading-relaxed text-ear-black">{body}</Text>
          <div className="pt-1">
            <Button
              asChild
              className="h-auto rounded-none bg-ear-black px-8 py-4 text-xs font-semibold uppercase tracking-widest text-ear-off-white hover:bg-ear-black/90"
            >
              <Link href={learnMoreHref}>Learn more</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
