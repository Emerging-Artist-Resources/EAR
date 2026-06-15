import { FiscalSponsorshipFaqApplySection } from "@/components/services/FiscalSponsorshipFaqApplySection"
import { FiscalSponsorshipFaqContent } from "@/components/services/FiscalSponsorshipFaqContent"
import { H1 } from "@/components/ui/typography"
import { buildPageMetadata } from "@/lib/config/site-metadata"
import {
  FISCAL_SPONSORSHIP_FAQ_APPLY_IMAGE,
  fiscalSponsorshipFaqApply,
  fiscalSponsorshipFaqPage,
} from "@/lib/content/fiscal-sponsorship-faq"

export const metadata = buildPageMetadata({
  title: "Fiscal Sponsorship FAQ",
  description:
    "Frequently asked questions about fiscal sponsorship for emerging artists in NYC through Emerging Artist Resources—Type C sponsorship, fees, application process, and more.",
  path: "/services/fiscal-sponsorship/faq",
})

export default function FiscalSponsorshipFaqPage() {
  return (
    <main>
      <div className="bg-secondary-50">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-5 sm:py-12 lg:px-6 lg:py-20">
        <H1
          id="services-hero-heading"
          className="text-3xl font-bold uppercase tracking-wide text-ear-black sm:text-4xl md:text-5xl lg:text-6xl"
        >
          {fiscalSponsorshipFaqPage.title}
        </H1>

          <FiscalSponsorshipFaqContent />
        </div>
      </div>

      <FiscalSponsorshipFaqApplySection
        title={fiscalSponsorshipFaqApply.title}
        buttonLabel={fiscalSponsorshipFaqApply.buttonLabel}
        imageSrc={FISCAL_SPONSORSHIP_FAQ_APPLY_IMAGE}
        imageAlt={fiscalSponsorshipFaqApply.imageAlt}
      />
    </main>
  )
}
