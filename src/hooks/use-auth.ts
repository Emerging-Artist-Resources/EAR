import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { getUserRole, extractUserName } from "@/lib/authz"

export interface AuthState {
  user: User | null
  role: "ADMIN" | "REVIEWER" | "EDITOR" | "USER" | undefined
  userName: string | null
  isAuthed: boolean
  isLoading: boolean
}

const updateState = (session: { user: User } | null, setState: (state: AuthState) => void) => {
  if (session?.user) {
    const role = getUserRole(session.user)
    const name = extractUserName(session.user)
    
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
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: undefined,
    userName: null,
    isAuthed: false,
    isLoading: true,
  })

  useEffect(() => {
    let isMounted = true
    let authStateChangeHandled = false

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return
      authStateChangeHandled = true
      updateState(session, setState)
    })

    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!isMounted) return

        if (!authStateChangeHandled) {
          updateState(session, setState)
        }
      } catch (err) {
        console.error("Error getting session:", err)
        if (isMounted && !authStateChangeHandled) {
          setState({
            user: null,
            role: undefined,
            userName: null,
            isAuthed: false,
            isLoading: false,
          })
        }
      }
    }

    getSession()

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  return state
}
