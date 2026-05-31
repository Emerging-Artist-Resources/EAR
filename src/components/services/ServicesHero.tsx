import Link from "next/link"
import { BackgroundPageHero } from "@/components/shared/BackgroundPageHero"
import { Button } from "@/components/ui/button"

type ServicesHeroProps = {
  title: string
  inquiryHref?: string
  inquiryLabel?: string
  image: string
  headingId?: string
}

export function ServicesHero({
  title,
  inquiryHref,
  inquiryLabel = "Inquire here",
  image,
  headingId = "services-hero-heading",
}: ServicesHeroProps) {
  return (
    <BackgroundPageHero headingId={headingId} title={title} imageSrc={image}>
      {inquiryHref ? (
        <Button
          asChild
          className="h-auto rounded-none bg-ear-dark-red px-8 py-4 text-xs font-semibold uppercase tracking-widest text-ear-off-white hover:bg-ear-dark-red/90"
        >
          <Link href={inquiryHref}>{inquiryLabel}</Link>
        </Button>
      ) : null}
    </BackgroundPageHero>
  )
}
