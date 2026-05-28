import Image from "next/image"
import { H1, Text } from "@/components/ui/typography"
import { cn } from "@/lib/utils"
import { ABOUT_US_HERO_IMAGE_SRC, aboutUsHero } from "@/lib/content/about-us"

type AboutUsHeroSectionProps = {
  className?: string
}

export function AboutUsHeroSection({ className }: AboutUsHeroSectionProps) {
  return (
    <section
      className={cn("grid lg:grid-cols-2 bg-ear-black", className)}
      aria-labelledby="about-us-hero-heading"
    >

      <div className="flex flex-col justify-center bg-ear-black px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
        <H1
          id="about-us-hero-heading"
          className="text-6xl font-bold uppercase tracking-wide text-ear-off-white sm:text-4xl lg:text-5xl"
        >
          {aboutUsHero.title}
        </H1>
        <p className="mt-4 text-3xl font-sans  font-bold uppercase tracking-widest text-ear-baby-blue">
          {aboutUsHero.tagline}
        </p>
        <div className="mt-8 space-y-5">
          {aboutUsHero.paragraphs.map((paragraph, i) => (
            <Text key={i} className="text-pretty text-base leading-relaxed text-ear-off-white md:text-lg">
              {paragraph}
            </Text>
          ))}
        </div>
      </div>
      <div className="relative min-h-[20rem] lg:min-h-0 bg-ear-black">
        <Image
          src={ABOUT_US_HERO_IMAGE_SRC}
          alt="Emerging Artist Resources team and community"
          fill
          className="object-cover object-left"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
      </div>
    </section>
  )
}
