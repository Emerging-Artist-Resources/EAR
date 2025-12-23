import { useState, useEffect, useCallback } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { getUserRole } from "@/lib/authz"

export interface AuthState {
  user: User | null
  role: "ADMIN" | "REVIEWER" | "EDITOR" | "USER" | undefined
  userName: string | null
  isAuthed: boolean
  isLoading: boolean
}

/**
 * Custom hook for managing authentication state
 * Provides consistent auth state across the application
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: undefined,
    userName: null,
    isAuthed: false,
    isLoading: true,
  })

  const updateAuthState = useCallback(async () => {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.getUser()

    if (error || !data.user) {
      setState({
        user: null,
        role: undefined,
        userName: null,
        isAuthed: false,
        isLoading: false,
      })
      return
    }

    const user = data.user
    const role = getUserRole(user)
    const name =
      (user.user_metadata?.name as string | undefined) ||
      (user.user_metadata?.full_name as string | undefined) ||
      user.email ||
      null

    setState({
      user,
      role,
      userName: name,
      isAuthed: true,
      isLoading: false,
    })
  }, [])

  useEffect(() => {
    let isMounted = true
    const supabase = getSupabaseClient()

    // Initial auth check
    updateAuthState()

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return

      if (session?.user) {
        const role = getUserRole(session.user)
        const name =
          (session.user.user_metadata?.name as string | undefined) ||
          (session.user.user_metadata?.full_name as string | undefined) ||
          session.user.email ||
          null

        setState({
          user: session.user,
          role,
          userName: name,
          isAuthed: true,
          isLoading: false,
        })
      } else {
        setState({
          user: null,
          role: undefined,
          userName: null,
          isAuthed: false,
          isLoading: false,
        })
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [updateAuthState])

  return { ...state, refresh: updateAuthState }
}
