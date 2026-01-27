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
  const { isAuthed, userName, isLoading } = useAuth()

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
                
                <UserDropdown 
                  userName={userName || "User"} 
                />
              </>
            ) : (
              <Link href="/auth/signin">
                <Button variant="ghost">Sign In</Button>
              </Link>
            )}
          </div>
          <MobileNav 
            onSubmitPerformance={onSubmitPerformance}
          />
        </div>
      </div>
    </nav>
  )
}
