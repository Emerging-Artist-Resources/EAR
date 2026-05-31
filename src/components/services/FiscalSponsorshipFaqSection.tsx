import { FiscalSponsorshipFaqAnswerContent } from "@/components/services/FiscalSponsorshipFaqAnswer"
import { ReadMore } from "@/components/shared/ReadMore"
import type { FiscalSponsorshipFaqSection as FaqSection } from "@/lib/content/fiscal-sponsorship-faq"
import { cn } from "@/lib/utils"

type FiscalSponsorshipFaqSectionProps = {
  section: FaqSection
  className?: string
}

export function FiscalSponsorshipFaqSection({ section, className }: FiscalSponsorshipFaqSectionProps) {
  return (
    <section className={cn(className)} aria-labelledby={`faq-section-${section.id}`}>
      <h2
        id={`faq-section-${section.id}`}
        className="font-header mb-6 text-xl font-bold tracking-tight text-ear-black sm:mb-8 sm:text-2xl md:text-3xl"
      >
        {section.title}
      </h2>

      <dl className="divide-y divide-ear-black/10 border-t border-ear-black/10">
        {section.items.map((item) => (
          <div
            key={item.number}
            className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3 gap-y-2 py-5 sm:grid-cols-[minmax(3rem,4rem)_1fr] sm:gap-x-8 sm:gap-y-4 sm:py-8"
          >
            <dt className="font-sans text-sm font-bold tabular-nums text-ear-dark-red sm:pt-0.5 sm:text-base">
              {item.number}
            </dt>
            <dd className="min-w-0 space-y-3 sm:space-y-4">
              <h3 className="font-header text-lg font-bold tracking-tight text-ear-black sm:text-xl md:text-2xl">
                {item.question}
              </h3>
              <ReadMore lines={2}>
                <FiscalSponsorshipFaqAnswerContent answer={item.answer} />
              </ReadMore>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
