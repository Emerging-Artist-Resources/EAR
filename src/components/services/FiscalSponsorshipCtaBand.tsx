import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/typography"
import { cn } from "@/lib/utils"

type FiscalSponsorshipCtaBandProps = {
  overline: string
  headline: string
  body: string
  className?: string
}

const inquireOnDarkClass =
  "h-auto rounded-full border-transparent bg-secondary-50 px-8 py-6 text-xs font-semibold uppercase tracking-widest text-foreground hover:bg-secondary-100 hover:text-foreground disabled:opacity-100"

export function FiscalSponsorshipCtaBand({
  overline,
  headline,
  body,
  className,
}: FiscalSponsorshipCtaBandProps) {
  return (
    <section className={cn(className)} aria-labelledby="fiscal-sponsorship-cta-heading">
      <div className="h-1.5 w-full bg-secondary-50" aria-hidden />
      <div className="bg-foreground text-background">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center lg:gap-12 lg:px-8 lg:py-16">
          <div className="flex flex-col gap-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-background/90">{overline}</p>
            <h2 id="fiscal-sponsorship-cta-heading" className="text-3xl font-bold tracking-tight text-background sm:text-4xl">
              {headline}
            </h2>
            <Text className="text-base leading-relaxed text-background/85">{body}</Text>
          </div>
          <div className="flex lg:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled
              aria-disabled="true"
              className={cn(inquireOnDarkClass, "w-full sm:w-auto")}
            >
              Inquire here
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
