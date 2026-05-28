import { NavCard } from "@/components/home/nav-card"

export function ThreeCardsSection() {
  return (
    <section className="bg-ear-off-white px-4 py-16 sm:px-6 md:py-24">
      {/* Space for tape overlapping above each card */}
      <div className="mx-auto grid max-w-7xl gap-6 pt-6 md:grid-cols-3 md:gap-4 md:pt-8 lg:gap-6">
        <NavCard
          href="/about-us"
          title="About us"
          imageSrc="/images/home-about-us.png"
          tapeSrc="/accents/tape.png"
          imageAlt="Performers seated on stage"
        />
        <NavCard
          href="/calendar"
          title="Community calendar"
          imageSrc="/images/home-about-us.png"
          tapeSrc="/accents/tape.png"
          imageAlt="Community calendar"
        />
        <NavCard
          href="/services"
          title="Services"
          imageSrc="/images/home-services.png"
          tapeSrc="/accents/tape.png"
          imageAlt="Performer on stage"
        />
      </div>
    </section>
  )
}
