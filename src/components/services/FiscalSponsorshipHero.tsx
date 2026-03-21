import Link from "next/link"
import { Button } from "@/components/ui/button"
import { H1 } from "@/components/ui/typography"
import { cn } from "@/lib/utils"

type FiscalSponsorshipHeroProps = {
  title: string
  subline: string
  className?: string
}

const inquireOnDarkClass =
  "h-auto rounded-full border-transparent bg-secondary-50 px-8 py-6 text-xs font-semibold uppercase tracking-widest text-foreground hover:bg-secondary-100 hover:text-foreground disabled:opacity-100"

export function FiscalSponsorshipHero({ title, subline, className }: FiscalSponsorshipHeroProps) {
  return (
    <section
      className={cn("bg-foreground text-background", className)}
      aria-labelledby="fiscal-sponsorship-hero-heading"
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-8 lg:py-20">
        <div className="flex flex-col gap-6">
          <H1
            id="fiscal-sponsorship-hero-heading"
            className="text-background text-4xl font-bold uppercase tracking-wide sm:text-5xl md:text-6xl"
          >
            {title}
          </H1>
          <p className="text-lg font-medium uppercase tracking-wide text-secondary-50 sm:text-xl">
            {subline}
          </p>
          <div>
            <Button asChild variant="outline" className={cn(inquireOnDarkClass, "w-full sm:w-auto")}>
              <Link href="/services/fiscal-sponsorship/inquiry">Inquire here</Link>
            </Button>
          </div>
        </div>
        <div
          className="aspect-[4/5] w-full min-h-[240px] rounded-md bg-muted lg:max-h-[min(70vh,520px)] lg:justify-self-end"
          role="img"
          aria-label="Photo coming soon"
        />
      </div>
    </section>
  )
}
