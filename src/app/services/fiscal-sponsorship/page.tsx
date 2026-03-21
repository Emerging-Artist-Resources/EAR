import type { Metadata } from "next"
import { FiscalSponsorshipCtaBand } from "@/components/services/FiscalSponsorshipCtaBand"
import { FiscalSponsorshipExplainer } from "@/components/services/FiscalSponsorshipExplainer"
import { FiscalSponsorshipHero } from "@/components/services/FiscalSponsorshipHero"
import {
  fiscalSponsorshipCtaBand,
  fiscalSponsorshipExplainer,
  fiscalSponsorshipHero,
} from "@/lib/fiscal-sponsorship-content"

export const metadata: Metadata = {
  title: "Fiscal Sponsorship",
  description:
    "Learn about fiscal sponsorship through Emerging Artist Resources—what it is, how it works, and how to get started.",
}

export default function FiscalSponsorshipPage() {
  return (
    <main>
      <FiscalSponsorshipHero title={fiscalSponsorshipHero.title} subline={fiscalSponsorshipHero.subline} />
      <FiscalSponsorshipExplainer
        title={fiscalSponsorshipExplainer.title}
        paragraphs={fiscalSponsorshipExplainer.paragraphs}
      />
      <FiscalSponsorshipCtaBand
        overline={fiscalSponsorshipCtaBand.overline}
        headline={fiscalSponsorshipCtaBand.headline}
        body={fiscalSponsorshipCtaBand.body}
      />
    </main>
  )
}
