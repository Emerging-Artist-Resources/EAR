import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/typography"
import { FISCAL_SPONSORSHIP_INQUIRY_HREF } from "@/lib/fiscal-sponsorship-content"
import { cn } from "@/lib/utils"

type FiscalSponsorshipCtaBandProps = {
  overline: string
  headline: string
  body: string
  inquiryHref?: string
  className?: string
}

export function FiscalSponsorshipCtaBand({
  overline,
  headline,
  body,
  inquiryHref = FISCAL_SPONSORSHIP_INQUIRY_HREF,
  className,
}: FiscalSponsorshipCtaBandProps) {
  return (
    <section
      className={cn("bg-secondary-50 px-4 py-16 sm:px-6 lg:px-8 lg:py-20", className)}
      aria-labelledby="fiscal-sponsorship-cta-heading"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <p className="font-sans text-xs font-semibold uppercase tracking-widest text-ear-black/70">{overline}</p>
        <h2
          id="fiscal-sponsorship-cta-heading"
          className="font-header text-3xl font-bold tracking-tight text-ear-black sm:text-4xl md:text-5xl"
        >
          {headline}
        </h2>
        <Text className="text-ear-black text-pretty text-base leading-relaxed">{body}</Text>
        <div>
          <Button
            asChild
            className="h-auto w-full rounded-none bg-ear-black px-8 py-4 text-xs font-semibold uppercase tracking-widest text-ear-off-white hover:bg-ear-black/90 sm:w-auto"
          >
            <Link href={inquiryHref}>Apply here</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
