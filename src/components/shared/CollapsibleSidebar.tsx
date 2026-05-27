"use client"

import { useState, useEffect, type ComponentType } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { H3 } from "@/components/ui/typography"
import { VscChevronLeft, VscChevronRight } from "react-icons/vsc"
import { isRouteActive } from "@/lib/navigation/isRouteActive"
import { cn } from "@/lib/utils"

export interface SidebarNavItem {
  name: string
  href: string
  /** When true, only highlight on exact path match (e.g. `/profile`, `/admin`). */
  exact?: boolean
  icon?: ComponentType<{ className?: string }>
  badge?: number | string
}

export interface SidebarSection {
  label?: string
  items: SidebarNavItem[]
}

export interface CollapsibleSidebarProps {
  title: string
  storageKey: string
  sections: SidebarSection[]
}

function itemInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
}

export function CollapsibleSidebar({
  title,
  storageKey,
  sections,
}: CollapsibleSidebarProps) {
  const pathname = usePathname() ?? ""
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored !== null) {
      setIsCollapsed(stored === "true")
    }
  }, [storageKey])

  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem(storageKey, String(newState))
  }

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-shrink-0 flex-col h-full overflow-y-auto transition-[width] duration-300",
        "border-r border-sidebar-border bg-ear-off-white text-sidebar-foreground",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div
        className={cn(
          "flex items-center border-b border-sidebar-border p-6",
          isCollapsed ? "justify-center" : "justify-between"
        )}
      >
        {!isCollapsed && (
          <H3 className="text-lg text-sidebar-foreground">{title}</H3>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapse}
          className={cn(
            "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isCollapsed ? "" : "ml-auto"
          )}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <VscChevronRight className="w-4 h-4" />
          ) : (
            <VscChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>
      <nav className="p-4 space-y-4">
        {sections.map((section, sectionIndex) => (
          <div key={section.label ?? `section-${sectionIndex}`} className="space-y-1">
            {section.label && !isCollapsed && (
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.label}
              </p>
            )}
            {section.items.map((item) => {
              const active = isRouteActive(pathname, item.href, {
                exact: item.exact,
              })
              const Icon = item.icon

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={active ? "primary" : "ghost"}
                    className={cn(
                      "w-full font-medium",
                      isCollapsed ? "justify-center px-2" : "justify-start",
                      active
                        ? undefined
                        : "text-sidebar-foreground hover:bg-ear-baby-blue/30 hover:text-sidebar-accent-foreground"
                    )}
                    title={isCollapsed ? item.name : undefined}
                  >
                    {isCollapsed ? (
                      <span className="text-xs font-semibold text-sidebar-foreground">
                        {itemInitials(item.name)}
                      </span>
                    ) : (
                      <span className="flex w-full items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                          {Icon && <Icon className="h-4 w-4 shrink-0" />}
                          {item.name}
                        </span>
                        {item.badge != null && (
                          <span className="rounded-full bg-ear-orange px-2 py-0.5 text-xs font-medium text-ear-black">
                            {item.badge}
                          </span>
                        )}
                      </span>
                    )}
                  </Button>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}
