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
import { AboutUsNav } from "@/components/layout/about-us-nav"
import { ServicesNav } from "@/components/layout/services-nav"
import { publicNavItems } from "@/lib/navigation/public-nav"
import { cn } from "@/lib/utils"

export interface HeaderProps {
  showSubmitButton?: boolean
  onSubmitPerformance?: () => void
}

function HeaderNavLink({
  href,
  children,
  pathname,
  onDarkSurface,
  openInNewTab = false,
}: {
  href: string
  children: React.ReactNode
  pathname: string | null
  onDarkSurface: boolean
  openInNewTab?: boolean
}) {
  const isActive = pathname === href || (href !== "/" && pathname?.startsWith(href))

  return (
    <Link
      href={href}
      className="relative inline-flex flex-col items-center"
      {...(openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <Button
        variant="none"
        className={cn(
          isActive
            ? "text-ear-baby-blue hover:text-ear-baby-blue/80"
            : "text-ear-off-white hover:text-ear-off-white/80"
        )}
      >
        {children}
        {openInNewTab ? <span className="sr-only"> (opens in a new tab)</span> : null}
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

export const Header: React.FC<HeaderProps> = ({
  showSubmitButton = false,
  onSubmitPerformance,
}) => {
  const { isAuthed, userName, isLoading } = useAuth()
  const pathname = usePathname()
  const onDarkSurface = pathname === "/calendar" || pathname === "/"

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
              <React.Fragment key={item.href}>
                {item.href === "/calendar" ? (
                  <AboutUsNav onDarkSurface={onDarkSurface} />
                ) : null}
                <HeaderNavLink
                  href={item.href}
                  pathname={pathname}
                  onDarkSurface={onDarkSurface}
                >
                  {item.label}
                </HeaderNavLink>
              </React.Fragment>
            ))}
            <ServicesNav onDarkSurface={onDarkSurface} />
            <HeaderNavLink href="/donate" pathname={pathname} onDarkSurface={onDarkSurface} openInNewTab>
              Donate to EAR
            </HeaderNavLink>

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
