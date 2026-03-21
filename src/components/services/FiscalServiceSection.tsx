import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/typography"
import { cn } from "@/lib/utils"

type FiscalServiceSectionProps = {
  index: number
  title: string
  paragraphs: string[]
  className?: string
}

export function FiscalServiceSection({
  index,
  title,
  paragraphs,
  className,
}: FiscalServiceSectionProps) {
  const label = String(index).padStart(2, "0")

  return (
    <section className={cn(className)} aria-labelledby={`fiscal-service-${index}-heading`}>
      <h2
        id={`fiscal-service-${index}-heading`}
        className="text-foreground mb-6 text-lg font-semibold tracking-wide sm:text-xl"
      >
        <span className="text-muted-foreground tabular-nums">{label}</span>{" "}
        <span className="uppercase tracking-wider">{title}</span>
      </h2>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] lg:items-center lg:gap-10">
        <div className="space-y-4">
          {paragraphs.map((body, i) => (
            <Text key={`${index}-${i}`} className="text-foreground text-pretty text-base leading-relaxed">
              {body}
            </Text>
          ))}
        </div>

        <div className="flex lg:justify-end">
          <Button
            type="button"
            variant="default"
            disabled
            aria-disabled="true"
            className="h-auto w-full rounded-full px-8 py-6 text-xs font-semibold uppercase tracking-widest hover:bg-primary disabled:opacity-100 sm:w-auto"
          >
            Inquire here
          </Button>
        </div>
      </div>
    </section>
  )
}
