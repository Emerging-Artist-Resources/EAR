import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/typography"
import { FISCAL_SPONSORSHIP_FAQ_HREF } from "@/lib/fiscal-sponsorship-content"
import { cn } from "@/lib/utils"

type FiscalSponsorshipExplainerProps = {
  title: string
  body: string
  learnMoreHref?: string
  className?: string
}

function ExplainerImagePlaceholder() {
  return (
    <div
      className="aspect-[3/4] min-h-[280px] w-full bg-muted lg:aspect-auto lg:min-h-[min(50vh,480px)]"
      role="img"
      aria-label="Fiscal sponsorship — image coming soon"
    />
  )
}

export function FiscalSponsorshipExplainer({
  title,
  body,
  learnMoreHref = FISCAL_SPONSORSHIP_FAQ_HREF,
  className,
}: FiscalSponsorshipExplainerProps) {
  return (
    <section
      className={cn("bg-secondary-50", className)}
      aria-labelledby="fiscal-sponsorship-explainer-heading"
    >
      <div className="grid lg:grid-cols-2">
        <ExplainerImagePlaceholder />

        <div className="flex flex-col justify-center gap-6 px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
          <h2
            id="fiscal-sponsorship-explainer-heading"
            className="font-header text-3xl font-bold tracking-tight text-ear-black sm:text-4xl"
          >
            {title}
          </h2>
          <Text className="text-ear-black text-pretty text-base leading-relaxed">{body}</Text>
          <div>
            <Button
              asChild
              className="h-auto w-full rounded-none bg-ear-black px-8 py-4 text-xs font-semibold uppercase tracking-widest text-ear-off-white hover:bg-ear-black/90 sm:w-auto"
            >
              <Link href={learnMoreHref}>Learn more</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
