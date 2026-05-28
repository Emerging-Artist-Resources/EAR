import type {
  FiscalSponsorshipFaqAnswer,
  FiscalSponsorshipFaqItem,
  FiscalSponsorshipFaqSection,
} from "@/lib/fiscal-sponsorship-faq-content"

export function getFaqAnswerSearchText(answer: FiscalSponsorshipFaqAnswer): string {
  if (answer.type === "paragraphs") {
    return answer.paragraphs.join(" ")
  }
  return [answer.intro ?? "", ...answer.items].filter(Boolean).join(" ")
}

export function getFaqItemSearchText(item: FiscalSponsorshipFaqItem): string {
  return [item.number, item.question, getFaqAnswerSearchText(item.answer)].join(" ")
}

function matchesQuery(text: string, query: string): boolean {
  return text.toLowerCase().includes(query)
}

export function filterFaqSections(
  sections: readonly FiscalSponsorshipFaqSection[],
  query: string
): FiscalSponsorshipFaqSection[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return [...sections]
  }

  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => matchesQuery(getFaqItemSearchText(item), normalized)),
    }))
    .filter((section) => section.items.length > 0)
}
