"use client"
import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { UserDropdown } from "@/components/ui/user-dropdown"
import MobileNav from "@/components/mobile-nav"
import { useAuth } from "@/hooks/use-auth"
import { H3 } from "@/components/ui/typography"

export interface HeaderProps {
  showSubmitButton?: boolean
  onSubmitPerformance?: () => void
}

export const Header: React.FC<HeaderProps> = ({
  showSubmitButton = false,
  onSubmitPerformance,
}) => {
  const { isAuthed, userName, role: userRole, isLoading } = useAuth()

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <H3 className="text-gray-900">Emerging Artist Resources</H3>
          </div>
          <div className="hidden lg:flex items-center space-x-4">
            {/* Public Navigation */}
            <Link href="/calendar">
              <Button variant="ghost">Calendar</Button>
            </Link>
            <Link href="/announcement">
              <Button variant="ghost">Announcements</Button>
            </Link>
            
            {!isLoading && isAuthed ? (
              <>
                {showSubmitButton && onSubmitPerformance && (
                  <Button onClick={onSubmitPerformance}>
                    Submit Performance
                  </Button>
                )}
                
                {/* Admin Navigation - visually separated */}
                {userRole === "ADMIN" && (
                  <>
                    <div className="mx-2 h-6 w-px bg-[var(--gray-300)]" aria-hidden="true" />
                    <Link href="/admin/analytics">
                      <Button variant="ghost">Analytics</Button>
                    </Link>
                    <Link href="/admin">
                      <Button variant="ghost">Review Listings</Button>
                    </Link>
                    <Link href="/admin/profiles">
                      <Button variant="ghost">Review Profiles</Button>
                    </Link>
                    <Link href="/admin/notifications">
                      <Button variant="ghost">Manage Announcements</Button>
                    </Link>
                  </>
                )}
                
                <UserDropdown 
                  userName={userName || "User"} 
                />
              </>
            ) : !isLoading ? (
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
