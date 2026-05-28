import type { Metadata } from "next"
import { DocumentationBioSection } from "@/components/services/DocumentationBioSection"
import { DocumentationServiceRow } from "@/components/services/DocumentationServiceRow"
import { ServicesHero } from "@/components/services/ServicesHero"
import {
  DOCUMENTATION_INQUIRY_HREF,
  documentationBio,
  documentationHero,
  documentationServiceRows,
} from "@/lib/content/documentation"

export const metadata: Metadata = {
  title: "Photography & Videography",
  description:
    "Professional photography and videography for performances, rehearsals, and events—documentary-style documentation through Emerging Artist Resources.",
}

export default function PhotographyVideographyPage() {
  return (
    <main>
      <ServicesHero title={documentationHero.title} inquiryHref={DOCUMENTATION_INQUIRY_HREF} />
      {documentationServiceRows.map((row) => (
        <DocumentationServiceRow
          key={row.id}
          title={row.title}
          priceLabel={row.priceLabel}
          body={row.body}
          imagePosition={row.imagePosition}
        />
      ))}
      <DocumentationBioSection
        sectionTitle={documentationBio.sectionTitle}
        studioName={documentationBio.studioName}
        paragraphs={documentationBio.paragraphs}
      />
    </main>
  )
}
