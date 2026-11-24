import Link from "next/link"
import type { ReactNode } from "react"
import type { LegalDocument, LegalProse } from "@/lib/content/legal"

type LegalDocumentPageProps = {
  document: LegalDocument
}

function renderLegalText(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const pattern = /\[([^\]]+)\]\(([^)]+)\)/g
  let cursor = 0

  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0
    if (index > cursor) {
      nodes.push(text.slice(cursor, index))
    }
    const label = match[1]
    const href = match[2]
    if (href.startsWith("/") || href.startsWith("mailto:")) {
      nodes.push(
        <Link key={`${href}-${index}`} href={href} className="underline underline-offset-4">
          {label}
        </Link>
      )
    } else {
      nodes.push(match[0])
    }
    cursor = index + match[0].length
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor))
  }

  return nodes
}

const proseClassName = "font-sans text-base leading-relaxed text-ear-black md:text-lg"

function LegalProseBlock({ block, headingLevel }: { block: LegalProse; headingLevel: "h2" | "h3" }) {
  const Heading = headingLevel

  return (
    <>
      {block.heading ? (
        <Heading
          className={
            headingLevel === "h2"
              ? "font-header text-xl font-bold tracking-tight sm:text-2xl"
              : "font-header text-lg font-bold tracking-tight sm:text-xl"
          }
        >
          {block.heading}
        </Heading>
      ) : null}
      {block.paragraphs?.map((paragraph, paragraphIndex) => (
        <p key={paragraphIndex} className={proseClassName}>
          {renderLegalText(paragraph)}
        </p>
      ))}
      {block.items && block.items.length > 0 ? (
        <ul className={`list-disc space-y-2 pl-5 ${proseClassName}`}>
          {block.items.map((item) => (
            <li key={item}>{renderLegalText(item)}</li>
          ))}
        </ul>
      ) : null}
      {block.closingParagraphs?.map((paragraph, paragraphIndex) => (
        <p key={`closing-${paragraphIndex}`} className={proseClassName}>
          {renderLegalText(paragraph)}
        </p>
      ))}
    </>
  )
}

export function LegalDocumentPage({ document }: LegalDocumentPageProps) {
  const dateLine = document.updatedLabel
    ? `Last Updated: ${document.updatedLabel}`
    : `Version ${document.version}`

  return (
    <main className="bg-ear-off-white text-ear-black">
      <article className="mx-auto max-w-3xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <header>
          <h1 className="font-header text-3xl font-bold tracking-tight sm:text-4xl">
            {document.title}
          </h1>
          <p className="mt-3 font-sans text-sm text-ear-black/70">{dateLine}</p>
        </header>
        <div className="mt-10 space-y-10">
          {document.sections.map((section, sectionIndex) => (
            <section key={section.heading ?? sectionIndex} className="space-y-4">
              <LegalProseBlock block={section} headingLevel="h2" />
              {section.blocks?.map((block, blockIndex) => (
                <div key={block.heading ?? blockIndex} className="space-y-4">
                  <LegalProseBlock block={block} headingLevel="h3" />
                </div>
              ))}
            </section>
          ))}
        </div>
      </article>
    </main>
  )
}
