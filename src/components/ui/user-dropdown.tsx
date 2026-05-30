"use client"

import { useState, useRef, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/lib/config/constants"

interface UserDropdownProps {
  userName: string
  isMobile?: boolean
}

export function UserDropdown({ userName, isMobile = false }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const isActive = pathname?.startsWith("/profile") ?? false

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleSignOut = async () => {
    setIsOpen(false)
    try {
      await supabase.auth.signOut()
      router.push("/auth/signin")
    } catch (err) {
      console.error("Sign out error:", err)
      router.push("/auth/signin")
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium focus:outline-none",
          isActive
            ? "text-ear-baby-blue hover:text-ear-baby-blue/80"
            : "text-ear-off-white hover:text-ear-off-white/80",
          isMobile && "text-base"
        )}
      >
        <span>Welcome, {userName}</span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 min-w-[10rem] bg-surface-panel rounded-md shadow-lg py-1 z-50 border border-border-default">
          <button
            onClick={() => {
              router.push(ROUTES.PROFILE)
              setIsOpen(false)
            }}
            className="block w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-ear-orange"
          >
            Dashboard
          </button>

          <button
            onClick={handleSignOut}
            className="block w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-ear-orange"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}
