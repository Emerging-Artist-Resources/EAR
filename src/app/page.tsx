"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.push("/announcement")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">Redirecting to home page...</div>
    </div>
  )
}
