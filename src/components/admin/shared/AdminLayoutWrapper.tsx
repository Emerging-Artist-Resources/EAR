"use client"

import { ReactNode } from "react"
import { useAuth } from "@/hooks/use-auth"
import { AdminSidebar } from "./AdminSidebar"
import { usePathname } from "next/navigation"

interface AdminLayoutWrapperProps {
  children: ReactNode
}

export function AdminLayoutWrapper({ children }: AdminLayoutWrapperProps) {
  const { role, isLoading } = useAuth()
  const pathname = usePathname()

  if (isLoading) {
    return <>{children}</>
  }

  if (role !== "ADMIN") {
    return <>{children}</>
  }

  if (pathname?.startsWith("/auth")) {
    return <>{children}</>
  }

  if (pathname?.startsWith("/donate")) {
    return <>{children}</>
  }

  if (pathname === "/") {
    return <div className="min-h-0 flex-1 w-full min-w-0">{children}</div>
  }

  if (pathname?.startsWith("/calendar")) {
    return (
      <div className="min-h-0 flex-1 px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    )
  }

  const isAdminPage = pathname?.startsWith("/admin")

  return (
    <div className="flex min-h-0 flex-1">
      <AdminSidebar />
      <main className="min-h-0 flex-1 min-w-0 overflow-auto">
        {isAdminPage ? (
          children
        ) : (
          <div className="py-8 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        )}
      </main>
    </div>
  )
}

