"use client"
import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { UserDropdown } from "@/components/ui/user-dropdown"
import MobileNav from "@/components/mobile-nav"
import { useAuth } from "@/hooks/use-auth"
import { H3 } from "@/components/ui/typography"
import { WavyLine } from "@/components/ui/wavy-line"
import { ServicesNav } from "@/components/layout/services-nav"
import { Heart } from "lucide-react"

export interface HeaderProps {
  showSubmitButton?: boolean
  onSubmitPerformance?: () => void
}

export const Header: React.FC<HeaderProps> = ({
  showSubmitButton = false,
  onSubmitPerformance,
}) => {
  const { isAuthed, userName, isLoading } = useAuth()
  const pathname = usePathname()

  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    const isActive = pathname === href || (href !== "/" && pathname?.startsWith(href))
    
    return (
      <Link href={href} className="relative inline-flex flex-col items-center">
        <Button variant="none" className={isActive ? "text-primary" : ""}>
          {children}
        </Button>
        {isActive && (
          <div className="absolute -bottom-1 left-0 right-0">
            <WavyLine 
              color="black" 
              height={2}
              wavePattern="hand-drawn"
            />
          </div>
        )}
      </Link>
    )
  }

  return (
    <nav className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <H3 className="text-gray-900">Emerging Artist Resources</H3>
          </div>
          <div className="hidden lg:flex items-center space-x-4">
            {/* Public Navigation */}
            <NavLink href="/calendar">Calendar</NavLink>
            <NavLink href="/announcement">Announcements</NavLink>
            <ServicesNav />

            <Button className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:scale-[1.03] hover:shadow-md transition-all duration-200">
              <Heart className="mr-2 h-4 w-4 text-white" />
              <Link href="/donate">Support Artists</Link>
            </Button>

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
