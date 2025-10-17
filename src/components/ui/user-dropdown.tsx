"use client"

import { useState, useRef, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"

interface UserDropdownProps {
  userName: string
  userRole?: string
  isMobile?: boolean
}

export function UserDropdown({ userName, userRole, isMobile = false }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  const supabase = getSupabaseClient()
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/auth/signin"
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary ${
          isMobile ? "text-base" : ""
        }`}
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
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
          {userRole !== "ADMIN" && (
            <button
              onClick={() => {
                window.location.href = "/profile"
                setIsOpen(false)
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              View Profile
            </button>
          )}
          <button
            onClick={() => {
              handleSignOut()
              setIsOpen(false)
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}
