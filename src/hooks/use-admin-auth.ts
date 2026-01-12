import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { fetchUserRoleWithFallback } from "@/lib/authz"
import { User } from "@supabase/supabase-js"

export function useAdminAuth() {
  const router = useRouter()
  const [authLoading, setAuthLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function checkAuth(sessionUser?: { id: string }) {
      try {
        let user = sessionUser
        if (!user) {
          const { data, error } = await supabase.auth.getUser()
          if (error || !data?.user) {
            if (isMounted) {
              setAuthLoading(false)
              setIsAuthorized(false)
              router.push("/auth/signin")
            }
            return
          }
          user = data.user
        }

        if (!isMounted) return

        const role = await fetchUserRoleWithFallback(user as unknown as User, supabase)

        if (!isMounted) return

        setUserRole(role || null)
        
        if (role !== "ADMIN") {
          setAuthLoading(false)
          setIsAuthorized(false)
          router.push("/dashboard")
          return
        }

        setIsAuthorized(true)
        setAuthLoading(false)
      } catch (err) {
        console.error("Auth check error:", err)
        if (isMounted) {
          setAuthLoading(false)
          setIsAuthorized(false)
          router.push("/auth/signin")
        }
      }
    }

    checkAuth()

    return () => {
      isMounted = false
    }
  }, [])

  return { authLoading, userRole, isAuthorized }
}

