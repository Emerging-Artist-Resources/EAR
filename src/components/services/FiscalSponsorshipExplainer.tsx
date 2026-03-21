import { Text } from "@/components/ui/typography"
import { cn } from "@/lib/utils"

type FiscalSponsorshipExplainerProps = {
  title: string
  paragraphs: readonly string[]
  className?: string
}

export function FiscalSponsorshipExplainer({ title, paragraphs, className }: FiscalSponsorshipExplainerProps) {
  return (
    <section
      className={cn("bg-secondary-50", className)}
      aria-labelledby="fiscal-sponsorship-explainer-heading"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-12">
          <div
            className="aspect-[3/4] w-full min-h-[200px] rounded-md bg-muted lg:aspect-auto lg:min-h-[320px]"
            role="img"
            aria-label="Image coming soon"
          />
          <div className="flex flex-col gap-6">
            <h2
              id="fiscal-sponsorship-explainer-heading"
              className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl"
            >
              {title}
            </h2>
            <div className="space-y-4">
              {paragraphs.map((p, i) => (
                <Text key={i} className="text-foreground text-pretty text-base leading-relaxed">
                  {p}
                </Text>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
