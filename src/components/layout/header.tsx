import React from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { UserDropdown } from "@/components/ui/user-dropdown"
import MobileNav from "@/components/mobile-nav"

export interface HeaderProps {
  showSubmitButton?: boolean
  onSubmitPerformance?: () => void
}

export const Header: React.FC<HeaderProps> = ({
  showSubmitButton = false,
  onSubmitPerformance,
}) => {
  const { data: session } = useSession()

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
            {session ? (
              <>
                {showSubmitButton && onSubmitPerformance && (
                  <Button onClick={onSubmitPerformance}>
                    Submit Performance
                  </Button>
                )}
                {session.user.role === "ADMIN" && (
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
                  userName={session.user.name || "User"} 
                  userRole={session.user.role}
                />
              </>
            ) : (
              <Link href="/auth/signin">
                <Button variant="ghost">Sign In</Button>
              </Link>
            )}
          </div>
          <MobileNav 
            userRole={session?.user?.role} 
            onSubmitPerformance={onSubmitPerformance}
          />
        </div>
      </div>
    </nav>
  )
}
