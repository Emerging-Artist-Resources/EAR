import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/typography"
import { DOCUMENTATION_INQUIRY_HREF } from "@/lib/content/documentation"
import { DOCUMENTATION_SERVICE_IMAGE_SIZES, MARKETING_IMAGE_QUALITY } from "@/lib/images"
import { cn } from "@/lib/utils"

type DocumentationServiceRowProps = {
  title: string
  priceLabel: string
  body: string
  imageSrc: string
  imageAlt: string
  imagePosition: "left" | "right"
  inquiryHref?: string
  className?: string
}

export function DocumentationServiceRow({
  title,
  priceLabel,
  body,
  imageSrc,
  imageAlt,
  imagePosition,
  inquiryHref = DOCUMENTATION_INQUIRY_HREF,
  className,
}: DocumentationServiceRowProps) {
  const headingId = `documentation-service-${title.toLowerCase().replace(/\s+/g, "-")}`

  return (
    <section className={cn(className)} aria-labelledby={headingId}>
      <div
        className={cn(
          "grid lg:grid-cols-2",
          imagePosition === "right" && "lg:[&>div:first-child]:order-2 lg:[&>div:last-child]:order-1"
        )}
      >
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

        <div className="flex w-full flex-col items-center justify-center gap-5 bg-secondary-50 px-6 py-10 text-center sm:px-10 sm:py-12 lg:aspect-square">
          <h2
            id={headingId}
            className="font-header max-w-md text-3xl font-bold tracking-tight text-ear-black sm:text-4xl"
          >
            {title}
          </h2>
          <p className="font-sans text-sm font-bold uppercase tracking-widest text-ear-dark-red sm:text-base">
            {priceLabel}
          </p>
          <Text className="max-w-md text-pretty text-base leading-relaxed text-ear-black">{body}</Text>
          <div>
            <Button
              asChild
              className="h-auto rounded-none bg-ear-black px-8 py-4 text-xs font-semibold uppercase tracking-widest text-ear-off-white hover:bg-ear-black/90"
            >
              <Link href={inquiryHref}>Book here</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
