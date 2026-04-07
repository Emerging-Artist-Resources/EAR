"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { H3, Text } from "@/components/ui/typography"
import { apiGet } from "@/lib/fetch-utils"
import type { ServiceInquirySummary } from "@/features/profile/server/types"
import { useAuth } from "@/hooks/use-auth"

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    })
  } catch {
    return iso
  }
}

export function ServiceInquiriesSection() {
  const { user } = useAuth()
  const [rows, setRows] = useState<ServiceInquirySummary[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      setRows([])
      return
    }
    const load = async () => {
      setLoading(true)
      try {
        const data = await apiGet<ServiceInquirySummary[]>("/api/profile/service-inquiries")
        setRows(data)
      } catch {
        setRows([])
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [user])

  if (!user) return null

  return (
    <section className="space-y-3" aria-labelledby="service-inquiries-heading">
      <H3 id="service-inquiries-heading" className="text-lg font-semibold">
        Service inquiries
      </H3>
      {loading ? (
        <Text className="text-muted-foreground text-sm">Loading…</Text>
      ) : rows.length === 0 ? (
        <Text className="text-muted-foreground text-sm">
          When you submit a documentation inquiry while signed in, it will appear here.
        </Text>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id}>
              <Card className="p-4">
                <div className="font-medium">{r.service_title ?? r.service_slug}</div>
                <Text className="text-muted-foreground text-sm">
                  {formatDate(r.created_at)} · {r.status}
                </Text>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
