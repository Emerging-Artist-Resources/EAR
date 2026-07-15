"use client"

import { ReactNode, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { AdminSidebar } from "./AdminSidebar"
import { DashboardSidebar } from "@/components/profile/dashboard/DashboardSidebar"
import {
  getAppLayoutMode,
  type ContentPadding,
} from "@/lib/navigation/getAppLayoutMode"
import { cn } from "@/lib/utils"

interface AdminLayoutWrapperProps {
  children: ReactNode
}

function MainContent({
  children,
  padding,
}: {
  children: ReactNode
  padding: ContentPadding
}) {
  if (padding === "none") {
    return <>{children}</>
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">{children}</div>
  )
}

function SidebarShell({
  sidebar,
  padding,
  children,
}: {
  sidebar: ReactNode
  padding: ContentPadding
  children: ReactNode
}) {
  const pathname = usePathname()
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0 })
  }, [pathname])

  return (
    <div className="flex min-h-0 flex-1 items-stretch overflow-hidden">
      {sidebar}
      <main
        ref={mainRef}
        className={cn("min-h-0 flex-1 min-w-0 overflow-y-auto")}
      >
        <MainContent padding={padding}>{children}</MainContent>
      </main>
    </div>
  )
}

/** Stable shell for calendar / home so auth resolve does not remount page content. */
function FullWidthShell({ children }: { children: ReactNode }) {
  return <div className="min-h-0 flex-1 w-full min-w-0">{children}</div>
}

export function AdminLayoutWrapper({ children }: AdminLayoutWrapperProps) {
  const { role, isLoading } = useAuth()
  const pathname = usePathname()
  // Path-only mode while auth loads — avoids remounting calendar/home when the
  // wrapper later switches from Fragment → FullWidthShell. Admin chrome still
  // waits until role is known.
  const mode = getAppLayoutMode(pathname, isLoading ? undefined : role)

  if (mode.type === "dashboard") {
    return (
      <SidebarShell sidebar={<DashboardSidebar />} padding={mode.contentPadding}>
        {children}
      </SidebarShell>
    )
  }

  if (!isLoading && mode.type === "admin") {
    return (
      <SidebarShell sidebar={<AdminSidebar />} padding={mode.contentPadding}>
        {children}
      </SidebarShell>
    )
  }

  if (mode.type === "bare") {
    return <>{children}</>
  }

  if (mode.type === "fullBleed" || mode.type === "calendar") {
    return <FullWidthShell>{children}</FullWidthShell>
  }

  return <>{children}</>
}
