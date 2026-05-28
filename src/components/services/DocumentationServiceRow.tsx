import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/typography"
import { DOCUMENTATION_INQUIRY_HREF } from "@/lib/content/documentation"
import { cn } from "@/lib/utils"

type DocumentationServiceRowProps = {
  title: string
  priceLabel: string
  body: string
  imagePosition: "left" | "right"
  inquiryHref?: string
  className?: string
}

function ServiceImagePlaceholder({ label }: { label: string }) {
  return (
    <div
      className="aspect-[4/3] min-h-[280px] w-full bg-muted lg:aspect-auto lg:min-h-[min(50vh,480px)]"
      role="img"
      aria-label={label}
    />
  )
}

export function DocumentationServiceRow({
  title,
  priceLabel,
  body,
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
        <ServiceImagePlaceholder label={`${title} — image coming soon`} />

        <div className="flex flex-col justify-center gap-6 bg-secondary-50 px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
          <h2 id={headingId} className="font-header text-3xl font-bold tracking-tight text-ear-black sm:text-4xl">
            {title}
          </h2>
          <p className="font-sans text-sm font-bold uppercase tracking-widest text-ear-dark-red sm:text-base">
            {priceLabel}
          </p>
          <Text className="text-ear-black text-pretty text-base leading-relaxed">{body}</Text>
          <div>
            <Button
              asChild
              className="h-auto w-full rounded-none bg-ear-black px-8 py-4 text-xs font-semibold uppercase tracking-widest text-ear-off-white hover:bg-ear-black/90 sm:w-auto"
            >
              <Link href={inquiryHref}>Book here</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
