"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/lib/config/constants"
import { Button } from "@/components/ui/button"
import {
  HeaderHoverDropdown,
  headerDropdownMenuItemClass,
} from "@/components/layout/header-hover-dropdown"

interface UserDropdownProps {
  userName: string
  isMobile?: boolean
}

export function UserDropdown({ userName, isMobile = false }: UserDropdownProps) {
  const router = useRouter()
  const pathname = usePathname()
  const isActive = pathname?.startsWith("/profile") ?? false

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/auth/signin")
    } catch (err) {
      console.error("Sign out error:", err)
      router.push("/auth/signin")
    }
  }

  return (
    <HeaderHoverDropdown
      align="right"
      trigger={
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 px-3 py-2 text-sm font-medium focus:outline-none",
            isActive
              ? "text-ear-baby-blue hover:text-ear-baby-blue/80"
              : "text-ear-off-white hover:text-ear-off-white/80",
            isMobile && "text-base"
          )}
        >
          <span>Welcome, {userName}</span>
          <ChevronDown
            className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover:rotate-180"
            aria-hidden
          />
        </button>
      }
    >
      <Button asChild variant="ghost" className={headerDropdownMenuItemClass}>
        <Link href={ROUTES.PROFILE} role="menuitem">
          Dashboard
        </Link>
      </Button>

      <Button
        variant="ghost"
        className={headerDropdownMenuItemClass}
        onClick={handleSignOut}
        role="menuitem"
      >
        Sign Out
      </Button>
    </HeaderHoverDropdown>
  )
}
