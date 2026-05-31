import type { Metadata } from "next"
import { FiscalServiceSection } from "@/components/services/FiscalServiceSection"
import { FiscalServicesCustomSupportSection } from "@/components/services/FiscalServicesCustomSupportSection"
import { ServicesHero } from "@/components/services/ServicesHero"
import {
  FISCAL_SERVICES_FINAL_IMAGE,
  FISCAL_SERVICES_HERO_IMAGE,
  FISCAL_SERVICES_INQUIRY_HREF,
  fiscalServiceSections,
  fiscalServicesCustomSupport,
  fiscalServicesHero,
} from "@/lib/content/fiscal-services"

export const metadata: Metadata = {
  title: "Fiscal Services",
  description:
    "Hourly fiscal services, fiscal mentorship, and bookkeeping support for artists, fiscally sponsored projects, and small nonprofit organizations through Emerging Artist Resources.",
}

export default function FiscalServicesPage() {
  return (
    <main>
      <ServicesHero
        title={fiscalServicesHero.title}
        inquiryHref={FISCAL_SERVICES_INQUIRY_HREF}
        image={FISCAL_SERVICES_HERO_IMAGE}
      />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {fiscalServiceSections.map((section) => (
          <FiscalServiceSection
            key={section.id}
            id={section.id}
            title={section.title}
            subheading={section.subheading}
            servicesIntro={section.servicesIntro}
            services={section.services}
            action={section.action}
          />
        ))}
      </div>
      <FiscalServicesCustomSupportSection
        title={fiscalServicesCustomSupport.title}
        body={fiscalServicesCustomSupport.body}
        actionLabel={fiscalServicesCustomSupport.actionLabel}
        backgroundSrc={FISCAL_SERVICES_FINAL_IMAGE}
        backgroundAlt="Artists in rehearsal supported through fiscal services"
      />
    </main>
  )
}
