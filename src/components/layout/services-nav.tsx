"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WavyLine } from "@/components/ui/wavy-line"
import { cn } from "@/lib/utils"
import { servicesNavItems } from "@/lib/navigation/services-nav"
import {
  HeaderHoverDropdown,
  headerDropdownMenuItemClass,
} from "@/components/layout/header-hover-dropdown"

export function ServicesNav({ onDarkSurface = false }: { onDarkSurface?: boolean }) {
  const pathname = usePathname()
  const isActive = pathname?.startsWith("/services") ?? false

  return (
    <HeaderHoverDropdown
      trigger={({ isOpen, toggle }) => (
        <div className="relative inline-flex flex-col items-center">
          <Button
            type="button"
            variant="none"
            className={cn(
              "gap-1",
              isActive
                ? "text-ear-baby-blue hover:text-ear-baby-blue/80"
                : "text-ear-off-white hover:text-ear-off-white/80",
            )}
            aria-haspopup="true"
            aria-expanded={isOpen}
            onClick={toggle}
          >
            <span>Services</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 transition-transform duration-150",
                isOpen && "rotate-180",
              )}
              aria-hidden
            />
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
      )}
    >
      <Button asChild variant="ghost" className={headerDropdownMenuItemClass}>
        <Link href="/services" role="menuitem">
          Overview
        </Link>
      </Button>
      {servicesNavItems.map((item) => (
        <div key={item.href}>
          <Button
            asChild
            variant="ghost"
            className={headerDropdownMenuItemClass}
          >
            <Link href={item.href} role="menuitem">
              {item.label}
            </Link>
          </Button>
          {item.subItems?.map((subItem) => (
            <Button
              key={subItem.href}
              asChild
              variant="ghost"
              className={cn(headerDropdownMenuItemClass, "pl-8 text-text-muted")}
            >
              <Link href={subItem.href} role="menuitem">
                {subItem.label}
              </Link>
            </Button>
          ))}
        </div>
      ))}
    </HeaderHoverDropdown>
  )
}
