import Image from "next/image"
import { H1 } from "@/components/ui/typography"

type ServicesHeroProps = {
  title: string
}

export function ServicesHero({ title }: ServicesHeroProps) {
  return (
    <section
      className="relative w-full min-h-[90dvh] overflow-hidden bg-ear-black"
      aria-labelledby="services-hero-heading"
    >
      <Image
        src="/images/service-hero.png"
        alt=""
        fill
        priority
        className="object-cover object-center opacity-90"
        sizes="100vw"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-ear-black/40 via-ear-black/20 to-ear-black/50"
        aria-hidden
      />
      <div className="relative z-10 mx-auto flex min-h-[90dvh] max-w-5xl flex-col items-center justify-center px-6 pb-24 pt-16 text-center">
        <H1
          id="services-hero-heading"
          className="text-6xl font-bold uppercase tracking-wide text-ear-off-white sm:text-7xl md:text-8xl"
        >
          {title}
        </H1>
      </div>
    </section>
  )
}
