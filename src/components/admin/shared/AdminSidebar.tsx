"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { H3 } from "@/components/ui/typography"
import { VscChevronLeft, VscChevronRight } from "react-icons/vsc"
import { useAuth } from "@/hooks/use-auth"

interface NavItem {
  name: string
  href: string
}

const adminNavItems: NavItem[] = [
  { name: "Analytics", href: "/admin/analytics" },
  { name: "Review Listings", href: "/admin" },
  { name: "Link Pieces", href: "/admin/pieces" },
  { name: "Review Profiles", href: "/admin/profiles" },
  { name: "Manage Announcements", href: "/admin/notifications" },
]

const SIDEBAR_STORAGE_KEY = "admin-sidebar-collapsed"

export function AdminSidebar() {
  const pathname = usePathname()
  const { role, isLoading } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (stored !== null) {
      setIsCollapsed(stored === "true")
    }
  }, [])

  if (isLoading || role !== "ADMIN") {
    return null
  }

  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(newState))
  }

  return (
    <aside
      className={`${
        isCollapsed ? "w-16" : "w-64"
      } hidden lg:block flex-shrink-0 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] transition-all duration-300`}
    >
      <div className={`p-6 border-b border-gray-200 flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
        {!isCollapsed && <H3>Admin Dashboard</H3>}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapse}
          className={isCollapsed ? "" : "ml-auto"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <VscChevronRight className="w-4 h-4" />
          ) : (
            <VscChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>
      <nav className="p-4 space-y-1">
        {adminNavItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "primary" : "ghost"}
                className={`w-full ${isCollapsed ? "justify-center px-2" : "justify-start"}`}
                title={isCollapsed ? item.name : undefined}
              >
                {isCollapsed ? (
                  <span className="text-xs font-semibold">
                    {item.name
                      .split(" ")
                      .map((word) => word[0])
                      .join("")}
                  </span>
                ) : (
                  item.name
                )}
              </Button>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

