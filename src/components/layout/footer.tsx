"use client"

import Link from "next/link"
import { Text } from "@/components/ui/typography"

export function Footer() {
  return (
    <footer className="mt-12 border-t border-[var(--gray-200)] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-[var(--gray-600)]">
            <Text className="text-[var(--gray-600)]">© {new Date().getFullYear()} Emerging Artist Resources</Text>
          </div>
          <nav className="flex flex-wrap items-center gap-4 text-sm">
            <Link className="underline text-[var(--gray-700)] hover:text-[var(--primary-700)]" href="/calendar">Calendar</Link>
            <Link className="underline text-[var(--gray-700)] hover:text-[var(--primary-700)]" href="/announcement">Announcements</Link>
            <Link className="underline text-[var(--gray-700)] hover:text-[var(--primary-700)]" href="/profile">Profile</Link>
            <Link className="underline text-[var(--gray-700)] hover:text-[var(--primary-700)]" href="/forms">Submit Listing</Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}


