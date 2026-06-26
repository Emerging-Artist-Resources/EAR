"use client"
import React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { UserDropdown } from "@/components/ui/user-dropdown"
import MobileNav from "@/components/mobile-nav"
import { useAuth } from "@/hooks/use-auth"
import { WavyLine } from "@/components/ui/wavy-line"
import { ServicesNav } from "@/components/layout/services-nav"
import { publicNavItems } from "@/lib/navigation/public-nav"
import { cn } from "@/lib/utils"
//import { Heart } from "lucide-react"

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
  const onDarkSurface = pathname === "/calendar" || pathname === "/"

  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    const isActive = pathname === href || (href !== "/" && pathname?.startsWith(href))
    
    return (
      <Link href={href} className="relative inline-flex flex-col items-center">
        <Button
          variant="none"
          className={cn(
            isActive
              ? "text-ear-baby-blue hover:text-ear-baby-blue/80"
              : "text-ear-off-white hover:text-ear-off-white/80"
          )}
        >
          {children}
        </Button>
        {isActive && href !== "/calendar" && (
          <div className="absolute -bottom-1 left-0 right-0">
            <WavyLine 
              color={onDarkSurface ? "var(--ear-off-white)" : "var(--ear-black)"} 
              height={2}
              wavePattern="hand-drawn"
            />
          </div>
        )}
      </Link>
    )
  }

  return (
    <nav className={"sticky top-0 z-50 shrink-0 bg-ear-black"}>
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link
              href="/"
              aria-label="Emerging Artist Resources — Home"
              className="flex shrink-0 items-center pl-2 lg:pl-0"
            >
              <Image
                src="/EAR-Logos/EAR LOGOS-12.png"
                alt="Emerging Artist Resources"
                width={120}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </Link>
          </div>
          <div className="hidden lg:flex items-center space-x-4">
            {/* Public Navigation */}
            {publicNavItems.map((item) => (
              <NavLink key={item.href} href={item.href}>
                {item.label}
              </NavLink>
            ))}
            <ServicesNav onDarkSurface={onDarkSurface} />

            {/* TEMPORARY DISABLED DONATE BUTTON IN HEADER
            <Button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:scale-[1.03] hover:shadow-md transition-all duration-200">
              <Heart className="mr-2 h-4 w-4 text-primary-foreground" />
              <Link href="/donate">Support Artists</Link>
            </Button> */}

            {!isLoading && isAuthed ? (
              <>
                {showSubmitButton && onSubmitPerformance && (
                  <Button onClick={onSubmitPerformance}>
                    Submit Performance
                  </Button>
                )}
                
                <UserDropdown userName={userName} />
              </>
            ) : (
              <Link href="/auth/signin">
                <Button
                  variant="none"
                  className={cn(
                    pathname?.startsWith("/auth/signin")
                      ? "text-ear-baby-blue hover:text-ear-baby-blue/80"
                      : "text-ear-off-white hover:text-ear-off-white/80"
                  )}
                >
                  Sign In
                </Button>
              </Link>
            )}
          </div>
          <MobileNav 
            onSubmitPerformance={onSubmitPerformance}
            onDarkSurface={onDarkSurface}
          />
        </div>
      </div>
    </nav>
  )
}
