"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { VscAccount } from "react-icons/vsc"

interface MobileNavProps {
  userRole?: string
  onSubmitPerformance?: () => void
}

export default function MobileNav({ userRole, onSubmitPerformance }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isAuthed, setIsAuthed] = useState(false)
  const [name, setName] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const supabase = getSupabaseClient()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      if (!mounted) return
      const u = data.user as { email?: string; user_metadata?: Record<string, unknown> } | null
      setIsAuthed(!!u)
      const display = (u?.user_metadata?.name as unknown) ?? u?.email ?? null
      setName(typeof display === 'string' ? display : null)
      setIsLoaded(true)
    })()
    return () => { mounted = false }
  }, [supabase])

  const navigation = [
    { name: "Calendar", href: "/calendar" },
    { name: "Announcements", href: "/announcement" },
    ...(userRole === "ADMIN" ? [
      { name: "Admin", href: "/admin" },
      { name: "Manage Notifications", href: "/admin/notifications" },
      { name: "Review Profiles", href: "/admin/profiles" }
    ] : []),
  ]

  return (
    <div className="lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-400 hover:text-gray-600"
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
        <div className="absolute top-16 left-0 right-0 bg-white shadow-lg z-50">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block"
                onClick={() => setIsOpen(false)}
              >
                <Button variant="ghost" className="w-full justify-start text-base">{item.name}</Button>
              </Link>
            ))}
            {isAuthed && onSubmitPerformance && (
              <Button
                onClick={() => {
                  onSubmitPerformance()
                  setIsOpen(false)
                }}
                variant="primary"
                className="w-full justify-start"
              >
                Submit Performance
              </Button>
            )}
              {isAuthed ? (
                <>
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <p className="px-3 py-2 text-sm text-gray-500">
                      Welcome, {name}
                    </p>
                  
                    <button
                      onClick={() => {
                        window.location.href = "/profile"
                        setIsOpen(false)
                      }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <VscAccount className="w-5 h-5" />
                    </button>
                    
                    <Button
                      onClick={async () => {
                        await supabase.auth.signOut()
                        setIsOpen(false)
                        window.location.href = "/auth/signin"
                      }}
                      variant="outline"
                      className="w-full justify-start text-base"
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
                <Button variant="outline" className="w-full justify-start text-base">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
