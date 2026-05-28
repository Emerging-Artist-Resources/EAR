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
        className="font-header mb-10 text-2xl font-bold tracking-tight text-ear-black sm:text-3xl"
      >
        {section.title}
      </h2>

      <dl className="divide-y divide-ear-black/10 border-t border-ear-black/10">
        {section.items.map((item) => (
          <div key={item.number} className="grid gap-4 py-8 sm:grid-cols-[minmax(3rem,4rem)_1fr] sm:gap-8">
            <dt className="font-sans text-sm font-bold tabular-nums text-ear-dark-red sm:text-base">{item.number}</dt>
            <dd className="min-w-0 space-y-4">
              <h3 className="font-header text-xl font-bold tracking-tight text-ear-black sm:text-2xl">
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
