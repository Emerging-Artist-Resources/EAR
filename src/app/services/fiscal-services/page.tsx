import type { Metadata } from "next"
import { H1 } from "@/components/ui/typography"
import { FiscalServiceSection } from "@/components/services/FiscalServiceSection"
import { fiscalServiceSections } from "@/lib/fiscal-services-content"

export const metadata: Metadata = {
  title: "Fiscal Services",
  description:
    "Bookkeeping, fiscal mentorship, and hourly fiscal services for artists and arts organizations through Emerging Artist Resources.",
}

export default function FiscalServicesPage() {
  return (
    <div className="min-h-[60vh]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <header className="border-foreground mb-16 border-b pb-8">
          <H1 className="text-ear-black text-4xl font-bold uppercase tracking-wide sm:text-5xl md:text-6xl">
            Fiscal services
          </H1>
        </header>

        <div className="space-y-16 text-ear-black">
          {fiscalServiceSections.map((section) => (
            <FiscalServiceSection
              key={section.index}
              index={section.index}
              title={section.title}
              paragraphs={section.paragraphs}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
