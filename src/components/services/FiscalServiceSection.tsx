import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/typography"
import type { FiscalServiceAction } from "@/lib/content/fiscal-services"
import { cn } from "@/lib/utils"

const fiscalServiceButtonClass =
  "h-auto w-full rounded-none bg-ear-black px-8 py-4 text-xs font-semibold uppercase tracking-widest text-ear-off-white hover:bg-ear-black/90 sm:w-auto sm:min-w-[12rem] lg:min-w-[14rem]"

type FiscalServiceSectionProps = {
  id: string
  title: string
  subheading: string
  servicesIntro: string
  services: readonly string[]
  action: FiscalServiceAction
  className?: string
}

function FiscalServiceActionButton({ action }: { action: FiscalServiceAction }) {
  if (action.type === "link") {
    return (
      <Button asChild className={fiscalServiceButtonClass}>
        <Link href={action.href}>{action.label}</Link>
      </Button>
    )
  }

  return (
    <Button type="button" aria-disabled="true" className={cn(fiscalServiceButtonClass, "cursor-default")}>
      {action.label}
    </Button>
  )
}

export function FiscalServiceSection({
  id,
  title,
  subheading,
  servicesIntro,
  services,
  action,
  className,
}: FiscalServiceSectionProps) {
  return (
    <section
      className={cn("border-b border-ear-black/10 py-12 last:border-b-0 sm:py-16", className)}
      aria-labelledby={`fiscal-service-${id}-heading`}
    >
      <div className="space-y-5">
        <h2
          id={`fiscal-service-${id}-heading`}
          className="font-header text-2xl font-bold uppercase tracking-tight text-ear-black sm:text-3xl"
        >
          {title}
        </h2>

        <Text className="text-ear-black text-pretty text-base font-bold leading-relaxed">{subheading}</Text>

        <div className="space-y-3">
          <Text className="text-ear-black text-pretty text-base leading-relaxed">{servicesIntro}</Text>
          <ul className="list-disc space-y-2 pl-5 font-sans text-base leading-relaxed text-ear-black">
            {services.map((item) => (
              <li key={item} className="text-pretty">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end pt-3">
          <FiscalServiceActionButton action={action} />
        </div>
      </div>
    </section>
  )
}
