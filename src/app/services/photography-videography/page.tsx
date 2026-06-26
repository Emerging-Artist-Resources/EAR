import { DocumentationBioSection } from "@/components/services/DocumentationBioSection"
import { DocumentationServiceRow } from "@/components/services/DocumentationServiceRow"
import { ServicesHero } from "@/components/services/ServicesHero"
import { buildPageMetadata } from "@/lib/config/site-metadata"
import {
  DOCUMENTATION_BIO_PORTRAIT,
  DOCUMENTATION_BIO_SECTION_SRC,
  DOCUMENTATION_INQUIRY_HREF,
  DOCUMENTATION_HERO_IMAGE,
  documentationBio,
  documentationHero,
  documentationServiceRows,
} from "@/lib/content/documentation"

export const metadata = buildPageMetadata({
  title: "Photography & Videography",
  description:
    "Professional photography and videography for performances, rehearsals, and events in NYC—documentary-style documentation through Emerging Artist Resources.",
  path: "/services/photography-videography",
})

export default function PhotographyVideographyPage() {
  return (
    <main>
      <ServicesHero title={documentationHero.title} inquiryHref={DOCUMENTATION_INQUIRY_HREF} image={DOCUMENTATION_HERO_IMAGE}/>
      {documentationServiceRows.map((row) => (
        <DocumentationServiceRow
          key={row.id}
          title={row.title}
          priceLabel={row.priceLabel}
          body={row.body}
          imageSrc={row.imageSrc}
          imageAlt={row.imageAlt}
          imagePosition={row.imagePosition}
        />
      ))}
      <DocumentationBioSection
        sectionTitle={documentationBio.sectionTitle}
        studioName={documentationBio.studioName}
        paragraphs={documentationBio.paragraphs}
        backgroundSrc={DOCUMENTATION_BIO_SECTION_SRC}
        backgroundAlt="Samzen, photographer at Samzen Studios"
        portraitSrc={DOCUMENTATION_BIO_PORTRAIT.src}
        portraitAlt={DOCUMENTATION_BIO_PORTRAIT.alt}
        portraitWidth={DOCUMENTATION_BIO_PORTRAIT.width}
        portraitHeight={DOCUMENTATION_BIO_PORTRAIT.height}
      />
    </main>
  )
}
