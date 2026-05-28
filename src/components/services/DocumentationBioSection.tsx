import { Text } from "@/components/ui/typography"
import { cn } from "@/lib/utils"

type DocumentationBioSectionProps = {
  sectionTitle: string
  studioName: string
  paragraphs: readonly string[]
  className?: string
}

function BioImagePlaceholder() {
  return (
    <div
      className="min-h-[320px] w-full bg-muted lg:min-h-full"
      role="img"
      aria-label="Samzen Studios portrait — image coming soon"
    />
  )
}

export function DocumentationBioSection({
  sectionTitle,
  studioName,
  paragraphs,
  className,
}: DocumentationBioSectionProps) {
  return (
    <section
      className={cn("bg-gray-200 px-4 py-16 sm:px-6 lg:px-8 lg:py-20", className)}
      aria-labelledby="documentation-bio-heading"
    >
      <div className="mx-auto max-w-7xl">
        <h2
          id="documentation-bio-heading"
          className="font-header mb-8 text-2xl font-bold uppercase tracking-wide text-ear-black sm:text-3xl"
        >
          {sectionTitle}
        </h2>

        <div className="grid overflow-hidden bg-white lg:grid-cols-2">
          <div className="flex flex-col justify-center gap-6 px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
            <p className="font-sans text-sm font-bold uppercase tracking-widest text-ear-dark-red sm:text-base">
              {studioName}
            </p>
            <div className="space-y-4">
              {paragraphs.map((paragraph, i) => (
                <Text key={i} className="text-ear-black text-pretty text-base leading-relaxed">
                  {paragraph}
                </Text>
              ))}
            </div>
          </div>
          <BioImagePlaceholder />
        </div>
      </div>
    </section>
  )
}
