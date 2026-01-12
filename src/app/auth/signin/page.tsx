"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"

import { supabase } from "@/lib/supabase/client"
import { H2, Text } from "@/components/ui/typography"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert } from "@/components/ui/alert"

export default function SignIn() {
  const router = useRouter()
  const isMountedRef = useRef(true)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    setLoading(true)
    setError("")

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      })

      if (signInError) {
        if (isMountedRef.current) {
          setError(signInError.message || "Invalid credentials")
          setLoading(false)
        }
        return
      }

      if (!isMountedRef.current) return

      if (data?.session) {
        router.replace("/announcement")
      } else {
        if (isMountedRef.current) {
          setError("Sign in failed. Please try again.")
          setLoading(false)
        }
      }
    } catch (err) {
      console.error("Sign in error:", err)
      if (isMountedRef.current) {
        setError("Something went wrong. Please try again.")
        setLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <H2 className="mt-6 text-center">Sign in to your account</H2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm flex flex-col gap-3">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="Email address"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && (
            <Alert variant="error" className="text-sm text-center">
              {error}
            </Alert>
          )}

          <div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </div>

          <div className="text-center">
            <Text>
              <Link href="/auth/signup" className="text-primary hover:opacity-80">
                Don&apos;t have an account? Sign up
              </Link>
            </Text>
          </div>

          <div className="text-center">
            <Text>
              <Link href="/announcement" className="text-gray-600 underline hover:text-gray-500">
                Continue as guest
              </Link>
            </Text>
          </div>
        </form>
      </div>
    </div>
  )
}
