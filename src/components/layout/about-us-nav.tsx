"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WavyLine } from "@/components/ui/wavy-line"
import { cn } from "@/lib/utils"
import { aboutNavItems } from "@/lib/navigation/about-nav"
import {
  HeaderHoverDropdown,
  headerDropdownMenuItemClass,
} from "@/components/layout/header-hover-dropdown"

export function AboutUsNav({ onDarkSurface = false }: { onDarkSurface?: boolean }) {
  const pathname = usePathname()
  const isActive = aboutNavItems.some(
    (item) => pathname === item.href || pathname?.startsWith(`${item.href}/`),
  )

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
            <span>About Us</span>
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
      {aboutNavItems.map((item) => (
        <Button
          key={item.href}
          asChild
          variant="ghost"
          className={headerDropdownMenuItemClass}
        >
          <Link href={item.href} role="menuitem">
            {item.label}
          </Link>
        </Button>
      ))}
    </HeaderHoverDropdown>
  )
}
