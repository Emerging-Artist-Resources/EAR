import { ServiceOverviewCard } from "@/components/services/ServiceOverviewCard"
import { ServicesHero } from "@/components/services/ServicesHero"
import { Text } from "@/components/ui/typography"
import {
  SERVICES_OVERVIEW_HERO_IMAGE,
  serviceOverviewItems,
  servicesOverviewHero,
} from "@/lib/content/services-overview"

export default function ServicesPage() {
  return (
    <main>
      <ServicesHero title={servicesOverviewHero.title} image={SERVICES_OVERVIEW_HERO_IMAGE} />
      <section className="bg-ear-off-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Text className="mx-auto mb-4 max-w-3xl text-center text-lg text-ear-black md:text-xl">
          EAR exists to ensure emerging artists and small collectives are given opportunities to thrive in 
          spaces where access and visibility are too often shaped by traditional funding priorities. Our goal 
          is to provide the scaffolding that allows your work to move forward, grow, and reach the audiences it deserves. 
          </Text>
          <Text className="mx-auto mb-16 max-w-3xl text-center text-lg text-ear-black md:text-xl">
          We encourage you to explore our services to discover how we can best support you and your collective. Don&apos;t 
          know where to start? Reach out! We are here to help. 
          </Text>
          <div className="grid grid-cols-1 items-stretch gap-8 md:grid-cols-3 md:gap-6 lg:gap-8">
            {serviceOverviewItems.map((item) => (
              <ServiceOverviewCard key={item.href} {...item} />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
