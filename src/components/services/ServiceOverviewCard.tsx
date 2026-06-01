import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Text } from "@/components/ui/typography"
import type { ServiceOverviewItem } from "@/lib/content/services-overview"

type ServiceOverviewCardProps = ServiceOverviewItem

export function ServiceOverviewCard({
  title,
  description,
  href,
  iconSrc,
  iconAlt,
}: ServiceOverviewCardProps) {
  return (
    <Card
      padding="lg"
      className="flex h-full flex-col items-center border-ear-black/15 bg-ear-off-white text-center shadow-md transition-shadow hover:shadow-lg"
    >
      <div className="mb-0 flex h-28 w-28 items-center justify-center sm:h-32 sm:w-32">
        <Image
          src={iconSrc}
          alt={iconAlt}
          width={128}
          height={128}
          className="h-auto max-h-full w-auto max-w-full object-contain"
        />
      </div>
      <h2 className="font-header mb-4 whitespace-pre-line text-center text-2xl font-bold uppercase tracking-wide text-ear-black md:text-3xl">
        {title}
      </h2>
      <Text className="mb-8 flex-1 text-ear-black">{description}</Text>
      <Button variant="outline" asChild className="border-ear-black text-ear-black hover:bg-ear-black/5">
        <Link href={href}>Learn more</Link>
      </Button>
    </Card>
  )
}
