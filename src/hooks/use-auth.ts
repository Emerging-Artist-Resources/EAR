import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { getUserRole, getUserRoleFromProfile } from "@/lib/authz"

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
    setState(prev => ({ ...prev, isLoading: true }))
    
    try {
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
      let role = getUserRole(user)
      
      if (!role) {
        try {
          role = await getUserRoleFromProfile(supabase, user.id)
        } catch (err) {
          console.error("Error fetching user role from profile:", err)
        }
      }
      
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
    } catch (err) {
      console.error("Error updating auth state:", err)
      setState({
        user: null,
        role: undefined,
        userName: null,
        isAuthed: false,
        isLoading: false,
      })
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    // Initial auth check
    updateAuthState()

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return

      try {
        if (session?.user) {
          setState(prev => ({ ...prev, isLoading: true }))
          
          let role = getUserRole(session.user)
          
          if (!role) {
            try {
              role = await getUserRoleFromProfile(supabase, session.user.id)
            } catch (err) {
              console.error("Error fetching user role from profile:", err)
            }
          }
          
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
      } catch (err) {
        console.error("Error in auth state change handler:", err)
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
  }, [])

  return { ...state, refresh: updateAuthState }
}
