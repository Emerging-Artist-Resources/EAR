import React from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import MobileNav from "@/components/mobile-nav"

export interface HeaderProps {
  title: string
  showSubmitButton?: boolean
  onSubmitPerformance?: () => void
}

export const Header: React.FC<HeaderProps> = ({
  title,
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
              {title}
            </h1>
          </div>
          <div className="hidden lg:flex items-center space-x-4">
            {session ? (
              <>
                {showSubmitButton && onSubmitPerformance && (
                  <Button onClick={onSubmitPerformance}>
                    Submit Performance
                  </Button>
                )}
                {session.user.role !== "ADMIN" && (
                  <Link href="/profile">
                    <Button variant="ghost">My Profile</Button>
                  </Link>
                )}
                {session.user.role === "ADMIN" && (
                  <Link href="/admin">
                    <Button variant="ghost">Admin Dashboard</Button>
                  </Link>
                )}
                <span className="text-gray-700">Welcome, {session.user.name}</span>
                <Button
                  variant="ghost"
                  onClick={() => window.location.href = "/api/auth/signout"}
                >
                  Sign Out
                </Button>
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
