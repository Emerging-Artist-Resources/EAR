"use client"

import { AdminEventItem } from "./types"
import { Card } from "@/components/ui/card"
import { Text } from "@/components/ui/typography"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { AdminEventCard } from "./AdminEventCard"
import type { AdminEventDetail } from "./types"

export function AdminEventList({
  items,
  onReview,
}: {
  items: AdminEventItem[]
  onReview: (id: string, status: "APPROVED" | "REJECTED", comments: string) => Promise<void>
}) {
  const [selected, setSelected] = useState<AdminEventItem | null>(null)
  const [open, setOpen] = useState(false)
  const [selectedDetail, setSelectedDetail] = useState<AdminEventDetail | null>(null)
  const [loadingSelected, setLoadingSelected] = useState(false)

  if (!items.length) {
    return (
      <Card className="p-8 text-center">
        <Text className="text-[var(--gray-600)]">No events found for the selected filter.</Text>
      </Card>
    )
  }

  return (
    <>
      <div className="overflow-x-auto rounded-md border border-[var(--gray-200)] bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--gray-50)] text-[var(--gray-700)]">
            <tr>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Title</th>
              <th className="px-3 py-2 text-left">Submitted</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((ev) => {
              const submitted = new Date(ev.submitted_at).toLocaleString()
              const title = ev.title ?? ev.id
              return (
                <tr key={ev.id} className="border-t border-[var(--gray-200)]">
                  <td className="px-3 py-2 capitalize">{ev.type}</td>
                  <td className="px-3 py-2">{title}</td>
                  <td className="px-3 py-2">{submitted}</td>
                  <td className="px-3 py-2 capitalize">{ev.status}</td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        setLoadingSelected(true)
                        setSelected(ev)
                        setOpen(true)
                        try {
                          const res = await fetch(`/api/admin/events/${ev.id}`)
                          if (res.ok) {
                            const json = await res.json()
                            setSelectedDetail(json?.data ?? null)
                          } else {
                            setSelectedDetail(null)
                          }
                        } finally {
                          setLoadingSelected(false)
                        }
                      }}
                    >
                      View submission
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Submission details" headerClassName="bg-primary">
        {loadingSelected && (
          <div className="p-6 text-center text-[var(--gray-600)]">Loading…</div>
        )}
        {!loadingSelected && selected && (
          <div className="max-h-[70vh] overflow-y-auto">
            <AdminEventCard
              item={selected}
              initialDetail={selectedDetail}
              autoExpand
              onReview={async (id, status, comments) => {
                await onReview(id, status, comments)
                setOpen(false)
              }}
            />
          </div>
        )}
      </Modal>
    </>
  )
}
