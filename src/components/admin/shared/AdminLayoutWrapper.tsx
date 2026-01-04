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

  const isAdminPage = pathname?.startsWith("/admin")

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-[var(--gray-50)]">
      <AdminSidebar />
      <main className="flex-1 min-w-0 overflow-auto">
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

