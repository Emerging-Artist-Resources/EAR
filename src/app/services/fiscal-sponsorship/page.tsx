import type { Metadata } from "next"
import { FiscalSponsorshipBenefitsSection } from "@/components/services/FiscalSponsorshipBenefitsSection"
import { FiscalSponsorshipCtaBand } from "@/components/services/FiscalSponsorshipCtaBand"
import { FiscalSponsorshipExplainer } from "@/components/services/FiscalSponsorshipExplainer"
import { FiscalSponsorshipPartnershipSection } from "@/components/services/FiscalSponsorshipPartnershipSection"
import { ServicesHero } from "@/components/services/ServicesHero"
import {
  FISCAL_SPONSORSHIP_INQUIRY_HREF,
  FISCAL_SPONSORSHIP_EXPLAINER_IMAGE,
  FISCAL_SPONSORSHIP_HERO_IMAGE,
  FISCAL_SPONSORSHIP_PARTNERSHIP_IMAGE,
  fiscalSponsorshipBenefits,
  fiscalSponsorshipCtaBand,
  fiscalSponsorshipExplainer,
  fiscalSponsorshipHero,
  fiscalSponsorshipPartnership,
} from "@/lib/content/fiscal-sponsorship"

export const metadata: Metadata = {
  title: "Fiscal Sponsorship",
  description:
    "Learn about fiscal sponsorship through Emerging Artist Resources—what it is, how it works, and how to get started.",
}

export default function FiscalSponsorshipPage() {
  return (
    <main>
      <ServicesHero title={fiscalSponsorshipHero.title} inquiryHref={FISCAL_SPONSORSHIP_INQUIRY_HREF} image={FISCAL_SPONSORSHIP_HERO_IMAGE}/>
      <FiscalSponsorshipExplainer
        title={fiscalSponsorshipExplainer.title}
        body={fiscalSponsorshipExplainer.body}
        imageSrc={FISCAL_SPONSORSHIP_EXPLAINER_IMAGE}
        imageAlt="Artists supported through fiscal sponsorship"
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
      <FiscalSponsorshipPartnershipSection
        paragraphs={fiscalSponsorshipPartnership.paragraphs}
        imageSrc={FISCAL_SPONSORSHIP_PARTNERSHIP_IMAGE}
        imageAlt="mignolo arts center"
      />
    </main>
  )
}
