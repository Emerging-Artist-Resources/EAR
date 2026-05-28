import type { Metadata } from "next"
import { FiscalServiceSection } from "@/components/services/FiscalServiceSection"
import { ServicesHero } from "@/components/services/ServicesHero"
import {
  FISCAL_SERVICES_INQUIRY_HREF,
  fiscalServiceSections,
  fiscalServicesHero,
} from "@/lib/content/fiscal-services"

export const metadata: Metadata = {
  title: "Fiscal Services",
  description:
    "Bookkeeping, fiscal mentorship, and hourly fiscal services for artists and arts organizations through Emerging Artist Resources.",
}

export default function FiscalServicesPage() {
  return (
    <main>
      <ServicesHero title={fiscalServicesHero.title} inquiryHref={FISCAL_SERVICES_INQUIRY_HREF} />
      <div className="min-h-[60vh]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
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
    </main>
  )
}
