"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { VscAccount } from "react-icons/vsc"
import { useAuth } from "@/hooks/use-auth"
import { ROUTES } from "@/lib/constants"
import { servicesNavItems } from "@/lib/services-nav"
import { Heart } from "lucide-react"

interface MobileNavProps {
  onSubmitPerformance?: () => void
  onDarkSurface?: boolean
}

const isProtectedRoute = (pathname: string): boolean => {
  return pathname.startsWith("/admin") || 
         pathname.startsWith("/profile") || 
         pathname.startsWith("/forms")
}

export default function MobileNav({ onSubmitPerformance, onDarkSurface = false }: MobileNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const { isAuthed, userName, role } = useAuth()

  const publicNavigation = [
    { name: "Calendar", href: "/calendar" },
    { name: "Announcements", href: "/announcement" },
  ]

  const adminNavigation = role === "ADMIN" ? [
    { name: "Analytics", href: "/admin/analytics" },
    { name: "Review Listings", href: "/admin" },
    { name: "Manage Notifications", href: "/admin/notifications" },
    { name: "Review Profiles", href: "/admin/profiles" }
  ] : []

  return (
    <div className="lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          onDarkSurface
            ? "text-ear-off-white hover:bg-white/10 hover:text-ear-off-white"
            : "text-ear-baby-blue hover:bg-ear-baby-blue/10 hover:text-ear-baby-blue"
        )}
        aria-label="Toggle menu"
      >
        <span className="sr-only">Open main menu</span>
        <svg
          className={`${isOpen ? "hidden" : "block"} h-6 w-6`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg
          className={`${isOpen ? "block" : "hidden"} h-6 w-6`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </Button>

      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-surface-panel shadow-lg z-50">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* Public Navigation */}
            {publicNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block"
                onClick={() => setIsOpen(false)}
              >
                <Button variant="ghost" className="w-full justify-start text-ear-black">{item.name}</Button>
              </Link>
            ))}

            <Link href="/donate" className="block" onClick={() => setIsOpen(false)}>
              <Button variant="default" className="mt-1 w-full justify-start text-ear-off-white">
                <Heart className="mr-2 h-4 w-4 text-ear-off-white" />
                Support Artists
              </Button>
            </Link>

            <div className="border-t border-border-default my-2" />
            <div className="px-2 py-1">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Services</p>
            </div>
            {servicesNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block"
                onClick={() => setIsOpen(false)}
              >
                <Button variant="ghost" className="w-full justify-start text-ear-black">
                  {item.label}
                </Button>
              </Link>
            ))}
            
            {/* Admin Navigation - visually separated */}
            {adminNavigation.length > 0 && (
              <>
                <div className="border-t border-border-default my-2" />
                <div className="px-2 py-1">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Admin</p>
                </div>
                {adminNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="block"
                    onClick={() => setIsOpen(false)}
                  >
                    <Button variant="ghost" className="w-full justify-start text-ear-black">{item.name}</Button>
                  </Link>
                ))}
              </>
            )}
            {isAuthed && onSubmitPerformance && (
              <Button
                onClick={() => {
                  onSubmitPerformance()
                  setIsOpen(false)
                }}
                variant="default"
                className="w-full justify-start"
              >
                Submit Performance
              </Button>
            )}
              {isAuthed ? (
                <>
                  <div className="border-t border-border-default pt-3 mt-3">
                    <p className="px-3 py-2 text-sm text-text-muted">
                      Welcome, {userName || "User"}
                    </p>
                  
                    <button
                      onClick={() => {
                        router.push("/profile")
                        setIsOpen(false)
                      }}
                        className="block w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-surface-panel-alt"
                      >
                        <VscAccount className="w-5 h-5" />
                    </button>
                    
                    <Button
                      onClick={async () => {
                        setIsOpen(false)
                        
                        try {
                          const { error } = await supabase.auth.signOut()
                          
                          if (error) {
                            console.error("Sign out error:", error)
                            return
                          }
                          
                          await new Promise(resolve => setTimeout(resolve, 100))
                          
                          const currentPath = pathname || (typeof window !== "undefined" ? window.location.pathname : null)
                          const shouldRedirect = currentPath && isProtectedRoute(currentPath)
                          
                          if (shouldRedirect) {
                            router.replace(ROUTES.HOME)
                          }
                        } catch (err) {
                          console.error("Sign out error:", err)
                        }
                      }}
                      variant="outline"
                      className="w-full justify-start text-ear-black"
                    >
                      Sign Out
                    </Button>
                  </div>
              </>
            ) : (
              <Link
                href="/auth/signin"
                className="block"
                onClick={() => setIsOpen(false)}
              >
                <Button variant="outline" className="w-full justify-start text-ear-black">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
