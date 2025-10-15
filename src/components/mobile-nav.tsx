"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"

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
    { name: "View Calendar", href: "/calendar" },
    { name: "Updates", href: "/notifications" },
    ...(userRole === "ADMIN" ? [
      { name: "Admin", href: "/admin" },
      { name: "Manage Notifications", href: "/admin/notifications" }
    ] : []),
  ]

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
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
      </button>

      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white shadow-lg z-50">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            {isAuthed && onSubmitPerformance && (
              <button
                onClick={() => {
                  onSubmitPerformance()
                  setIsOpen(false)
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50"
              >
                Submit Performance
              </button>
            )}
                        {isAuthed ? (
                          <>
                            <div className="border-t border-gray-200 pt-3 mt-3">
                              <p className="px-3 py-2 text-sm text-gray-500">
                                Welcome, {name}
                              </p>
                              {userRole !== "ADMIN" && (
                                <Link
                                  href="/profile"
                                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                                  onClick={() => setIsOpen(false)}
                                >
                                  View Profile
                                </Link>
                              )}
                              <button
                                onClick={async () => {
                                  await supabase.auth.signOut()
                                  setIsOpen(false)
                                  window.location.href = "/auth/signin"
                                }}
                                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                              >
                                Sign Out
                              </button>
                            </div>
              </>
            ) : (
              <Link
                href="/auth/signin"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                onClick={() => setIsOpen(false)}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
