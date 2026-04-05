import Link from "next/link"
import { H1, Text } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import { servicesNavItems } from "@/lib/services-nav"

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <H1 className="mb-2">Services</H1>
      <Text className="mb-8">Explore what Emerging Artist Resources offers. More detail coming soon.</Text>
      <ul className="flex flex-col gap-2">
        {servicesNavItems.map((item) => (
          <li key={item.href}>
            <Button variant="outline" asChild className="w-full justify-start sm:w-auto">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
