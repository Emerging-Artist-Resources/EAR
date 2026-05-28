import type { Metadata } from "next"
import { FiscalSponsorshipBenefitsSection } from "@/components/services/FiscalSponsorshipBenefitsSection"
import { FiscalSponsorshipCtaBand } from "@/components/services/FiscalSponsorshipCtaBand"
import { FiscalSponsorshipExplainer } from "@/components/services/FiscalSponsorshipExplainer"
import { FiscalSponsorshipPartnershipSection } from "@/components/services/FiscalSponsorshipPartnershipSection"
import { ServicesHero } from "@/components/services/ServicesHero"
import {
  FISCAL_SPONSORSHIP_INQUIRY_HREF,
  fiscalSponsorshipBenefits,
  fiscalSponsorshipCtaBand,
  fiscalSponsorshipExplainer,
  fiscalSponsorshipHero,
  fiscalSponsorshipPartnership,
} from "@/lib/fiscal-sponsorship-content"

export const metadata: Metadata = {
  title: "Fiscal Sponsorship",
  description:
    "Learn about fiscal sponsorship through Emerging Artist Resources—what it is, how it works, and how to get started.",
}

export default function FiscalSponsorshipPage() {
  return (
    <main>
      <ServicesHero title={fiscalSponsorshipHero.title} inquiryHref={FISCAL_SPONSORSHIP_INQUIRY_HREF} />
      <FiscalSponsorshipExplainer
        title={fiscalSponsorshipExplainer.title}
        body={fiscalSponsorshipExplainer.body}
      />
      <FiscalSponsorshipBenefitsSection
        sectionTitle={fiscalSponsorshipBenefits.sectionTitle}
        columns={fiscalSponsorshipBenefits.columns}
      />
      <FiscalSponsorshipCtaBand
        overline={fiscalSponsorshipCtaBand.overline}
        headline={fiscalSponsorshipCtaBand.headline}
        body={fiscalSponsorshipCtaBand.body}
      />
      <FiscalSponsorshipPartnershipSection paragraphs={fiscalSponsorshipPartnership.paragraphs} />
    </main>
  )
}
