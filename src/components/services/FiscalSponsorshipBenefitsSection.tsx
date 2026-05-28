import { Text } from "@/components/ui/typography"
import type { FiscalSponsorshipBenefit } from "@/lib/content/fiscal-sponsorship"
import { cn } from "@/lib/utils"

type FiscalSponsorshipBenefitsSectionProps = {
  sectionTitle: string
  columns: readonly FiscalSponsorshipBenefit[]
  className?: string
}

export function FiscalSponsorshipBenefitsSection({
  sectionTitle,
  columns,
  className,
}: FiscalSponsorshipBenefitsSectionProps) {
  return (
    <section
      className={cn("bg-ear-black px-4 py-16 text-ear-off-white sm:px-6 lg:px-8 lg:py-20", className)}
      aria-labelledby="fiscal-sponsorship-benefits-heading"
    >
      <div className="mx-auto max-w-7xl">
        <h2
          id="fiscal-sponsorship-benefits-heading"
          className="font-header mb-12 text-2xl font-bold tracking-tight sm:text-3xl lg:mb-16"
        >
          {sectionTitle}
        </h2>

        <div className="grid gap-12 md:grid-cols-3 md:gap-8 lg:gap-12">
          {columns.map((column) => (
            <div key={column.id} className="flex flex-col gap-4">
              <h3 className="font-sans text-lg font-bold uppercase tracking-wide sm:text-xl text-ear-baby-blue">{column.title}</h3>
              <div className="space-y-4">
                {column.paragraphs.map((paragraph, i) => (
                  <Text key={i} className="text-pretty text-base leading-relaxed text-ear-off-white/90">
                    {paragraph}
                  </Text>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
