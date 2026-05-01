"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WavyLine } from "@/components/ui/wavy-line"
import { cn } from "@/lib/utils"
import { servicesNavItems } from "@/lib/services-nav"

export function ServicesNav({ onDarkSurface = false }: { onDarkSurface?: boolean }) {
  const pathname = usePathname()
  const isActive = pathname?.startsWith("/services") ?? false

  return (
    <div className="group relative inline-flex flex-col items-center">
      <div className="relative inline-flex flex-col items-center">
        <Button
          asChild
          variant="none"
          className={cn("gap-1 text-ear-baby-blue hover:text-ear-baby-blue/80")}
        >
          <Link
            href="/services"
            aria-haspopup="true"
            className="inline-flex items-center gap-1"
          >
            <span>Services</span>
            <ChevronDown
              className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover:rotate-180 group-focus-within:rotate-180"
              aria-hidden
            />
          </Link>
        </Button>
        {isActive && (
          <div className="absolute -bottom-1 left-0 right-0">
            <WavyLine
              color={onDarkSurface ? "var(--ear-off-white)" : "var(--ear-black)"}
              height={2}
              wavePattern="hand-drawn"
            />
          </div>
        )}
      </div>

      <div className="absolute left-1/2 top-full z-50 min-w-[12rem] -translate-x-1/2 pt-1">
        <div
          className="invisible rounded-md border border-border-default bg-surface-panel py-1 text-text-primary opacity-0 shadow-lg transition-[opacity,visibility] duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
          role="menu"
        >
          {servicesNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block"
              role="menuitem"
            >
              <Button variant="ghost" className="h-auto w-full justify-start rounded-none px-4 py-2 text-sm font-normal">
                {item.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
