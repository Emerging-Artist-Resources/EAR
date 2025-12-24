"use client"

import { ReactNode } from "react"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { Text } from "@/components/ui/typography"

interface AdminLayoutProps {
  children: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { authLoading, isAuthorized } = useAdminAuth()

  if (authLoading) {
    return (
      <div className="min-h-screen grid place-items-center text-lg">
        <Text>Loading…</Text>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <div className="min-h-screen bg-[var(--gray-50)]">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  )
}

