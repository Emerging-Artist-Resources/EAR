import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FISCAL_SPONSORSHIP_INQUIRY_HREF } from "@/lib/fiscal-sponsorship-content"
import { cn } from "@/lib/utils"

type FiscalSponsorshipFaqApplySectionProps = {
  title: string
  buttonLabel: string
  inquiryHref?: string
  className?: string
}

function ApplyImagePlaceholder() {
  return (
    <div
      className="aspect-[3/4] min-h-[280px] w-full bg-muted lg:aspect-auto lg:min-h-[min(50vh,480px)]"
      role="img"
      aria-label="Fiscal sponsorship application — image coming soon"
    />
  )
}

export function FiscalSponsorshipFaqApplySection({
  title,
  buttonLabel,
  inquiryHref = FISCAL_SPONSORSHIP_INQUIRY_HREF,
  className,
}: FiscalSponsorshipFaqApplySectionProps) {
  return (
    <section
      className={cn(className)}
      aria-labelledby="fiscal-sponsorship-faq-apply-heading"
    >
      <div className="grid lg:grid-cols-2">
        <div className="flex flex-col justify-center gap-6 bg-secondary-50 px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
          <h2
            id="fiscal-sponsorship-faq-apply-heading"
            className="font-header text-3xl font-bold tracking-tight text-ear-black sm:text-4xl"
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
        <ApplyImagePlaceholder />
      </div>
    </section>
  )
}
