import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"

export function useAdminAuth() {
  const router = useRouter()
  const [authLoading, setAuthLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data?.user
      if (!user) {
        router.push("/auth/signin")
        return
      }
      const role = (user.app_metadata as { role: string } | undefined)?.role ?? null
      setUserRole(role)
      if (role !== "ADMIN") {
        router.push("/dashboard")
        return
      }
      setIsAuthorized(true)
      setAuthLoading(false)
    })
  }, [router])

  return { authLoading, userRole, isAuthorized }
}

