import Link from "next/link"
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
        className="text-ear-black mb-6 text-lg font-semibold tracking-wide sm:text-xl"
      >
        <span className="text-ear-baby-blue tabular-nums">{label}</span>{" "}
        <span className="uppercase tracking-wider">{title}</span>
      </h2>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] lg:items-center lg:gap-10">
        <div className="space-y-4">
          {paragraphs.map((body, i) => (
            <Text key={`${index}-${i}`} className="text-ear-black text-pretty text-base leading-relaxed">
              {body}
            </Text>
          ))}
        </div>

        <div className="flex lg:justify-end">
          <Button
            asChild
            variant="default"
            className="h-auto w-full rounded-full px-8 py-6 text-xs font-semibold uppercase tracking-widest sm:w-auto"
          >
            <Link href="/services/fiscal-services/inquiry">Inquire here</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
