"use client"

import { useMemo, useState } from "react"
import { FiscalSponsorshipFaqSection } from "@/components/services/FiscalSponsorshipFaqSection"
import { Input } from "@/components/ui/input"
import { Text } from "@/components/ui/typography"
import {
  fiscalSponsorshipFaqSections,
  type FiscalSponsorshipFaqSection as FaqSection,
} from "@/lib/content/fiscal-sponsorship-faq"
import { filterFaqSections } from "@/lib/content/fiscal-sponsorship-faq-search"

type FiscalSponsorshipFaqContentProps = {
  sections?: readonly FaqSection[]
}

export function FiscalSponsorshipFaqContent({
  sections = fiscalSponsorshipFaqSections,
}: FiscalSponsorshipFaqContentProps) {
  const [query, setQuery] = useState("")
  const filteredSections = useMemo(() => filterFaqSections(sections, query), [sections, query])
  const hasQuery = query.trim().length > 0

  return (
    <>
      <div className="mt-8 sm:mt-12 lg:mt-16">
        <label htmlFor="fiscal-sponsorship-faq-search" className="sr-only">
          Search fiscal sponsorship questions
        </label>
        <Input
          id="fiscal-sponsorship-faq-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search questions and answers…"
          className="h-11 rounded-none border-ear-black/20 bg-white text-base"
          autoComplete="off"
        />
      </div>

      <div className="mt-8 space-y-10 sm:mt-12 sm:space-y-16 lg:mt-16 lg:space-y-20">
        {filteredSections.length > 0 ? (
          filteredSections.map((section) => (
            <FiscalSponsorshipFaqSection key={section.id} section={section} />
          ))
        ) : (
          <Text className="text-ear-black text-base">
            {hasQuery
              ? "No questions match your search. Try different keywords."
              : "No questions to display."}
          </Text>
        )}
      </div>
    </>
  )
}
