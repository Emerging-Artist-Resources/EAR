import { getPublicAppUrl } from "@/lib/config/app-url"
import {
  fiscalSponsorshipFaqSections,
  type FiscalSponsorshipFaqAnswer,
} from "@/lib/content/fiscal-sponsorship-faq"

function formatFaqAnswerText(answer: FiscalSponsorshipFaqAnswer): string {
  if (answer.type === "paragraphs") {
    return answer.paragraphs.join("\n\n")
  }

  const parts = [...(answer.intro ? [answer.intro] : []), ...answer.items]
  return parts.join("\n")
}

export function buildFiscalSponsorshipFaqJsonLd() {
  const mainEntity = fiscalSponsorshipFaqSections.flatMap((section) =>
    section.items.map((item) => ({
      "@type": "Question" as const,
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer" as const,
        text: formatFaqAnswerText(item.answer),
      },
    }))
  )

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${getPublicAppUrl()}/services/fiscal-sponsorship/faq#faq`,
    mainEntity,
  }
}
