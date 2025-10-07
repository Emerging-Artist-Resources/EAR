import React from "react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { UserDropdown } from "@/components/ui/user-dropdown"
import MobileNav from "@/components/mobile-nav"
import { getSupabaseClient } from "@/lib/supabase/client"

type MinimalUser = {
  email?: string
  app_metadata?: Record<string, unknown>
  user_metadata?: Record<string, unknown>
}

function extractUserRole(user: unknown): string | undefined {
  if (!user || typeof user !== 'object') return undefined
  const u = user as MinimalUser
  const role = (u.app_metadata?.role ?? u.user_metadata?.role)
  return typeof role === 'string' ? role : undefined
}

function extractUserName(user: unknown): string | null {
  if (!user || typeof user !== 'object') return null
  const u = user as MinimalUser
  const name = u.user_metadata?.name
  if (typeof name === 'string') return name
  return typeof u.email === 'string' ? u.email : null
}

export interface HeaderProps {
  showSubmitButton?: boolean
  onSubmitPerformance?: () => void
}

export const Header: React.FC<HeaderProps> = ({
  showSubmitButton = false,
  onSubmitPerformance,
}) => {
  const supabase = getSupabaseClient()
  const [userName, setUserName] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | undefined>(undefined)
  const [isAuthed, setIsAuthed] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      if (!isMounted) return
      const u = data.user
      setIsAuthed(!!u)
      setUserName(extractUserName(u))
      setUserRole(extractUserRole(u))
      setIsLoaded(true)
    })()
    return () => { isMounted = false }
  }, [supabase])

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              Emerging Artist Resources
            </h1>
          </div>
          <div className="hidden lg:flex items-center space-x-4">
            <Link href="/calendar">
              <Button variant="ghost">View Calendar</Button>
            </Link>
            <Link href="/notifications">
              <Button variant="ghost">Updates</Button>
            </Link>
            {isLoaded && isAuthed ? (
              <>
                {showSubmitButton && onSubmitPerformance && (
                  <Button onClick={onSubmitPerformance}>
                    Submit Performance
                  </Button>
                )}
                {userRole === "ADMIN" && (
                  <>
                    <Link href="/admin">
                      <Button variant="ghost">Admin Dashboard</Button>
                    </Link>
                    <Link href="/admin/notifications">
                      <Button variant="ghost">Manage Notifications</Button>
                    </Link>
                  </>
                )}
                <UserDropdown 
                  userName={userName || "User"} 
                  userRole={userRole}
                />
              </>
            ) : isLoaded ? (
              <Link href="/auth/signin">
                <Button variant="ghost">Sign In</Button>
              </Link>
            ) : null}
          </div>
          <MobileNav 
            userRole={userRole} 
            onSubmitPerformance={onSubmitPerformance}
          />
        </div>
      </div>
    </nav>
  )
}
