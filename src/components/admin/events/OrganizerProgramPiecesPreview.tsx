"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { storageService } from "@/services/storage"
import { normalizeOrganizerProgramPiecesFromDb } from "@/lib/organizer-program-pieces"

const PRIVATE_BUCKET = "event-photos"

export function OrganizerProgramPiecesPreview({ raw }: { raw: unknown }) {
  const doc = normalizeOrganizerProgramPiecesFromDb(raw)
  const serialized = JSON.stringify(raw ?? null)

  const [urlsByPiece, setUrlsByPiece] = useState<Record<string, string[]>>({})

  useEffect(() => {
    const parsed = normalizeOrganizerProgramPiecesFromDb(JSON.parse(serialized) as unknown)
    if (!parsed?.pieces.length) return
    let cancelled = false
    const run = async () => {
      const next: Record<string, string[]> = {}
      for (const piece of parsed.pieces) {
        const urls: string[] = []
        for (const ph of (piece.photos ?? []).slice(0, 5)) {
          if (!ph?.path) continue
          try {
            urls.push(await storageService.createSignedUrl(supabase, PRIVATE_BUCKET, ph.path, 3600))
          } catch {
            // ignore
          }
        }
        next[piece.id] = urls
      }
      if (!cancelled) setUrlsByPiece(next)
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [serialized])

  if (!doc?.pieces.length) return null

  return (
    <div className="space-y-4 border border-[var(--gray-200)] rounded-lg p-4">
      <h6 className="font-semibold text-[var(--gray-900)]">Program pieces (organizer)</h6>
      {doc.pieces.map((piece, idx) => (
        <div key={piece.id} className="border-t border-[var(--gray-100)] pt-3 first:border-t-0 first:pt-0 space-y-1">
          <p className="text-sm font-medium text-[var(--gray-800)]">
            Piece {idx + 1}: {piece.title || piece.company || piece.id}
          </p>
          <p className="text-xs text-[var(--gray-600)]">Company: {piece.company}</p>
          <p className="text-xs text-[var(--gray-600)] whitespace-pre-wrap">{piece.description}</p>
          {piece.credits ? <p className="text-xs text-[var(--gray-600)]">Credits: {piece.credits}</p> : null}
          {Array.isArray(piece.selected_slots) && piece.selected_slots.length > 0 ? (
            <p className="text-xs text-[var(--gray-600)]">Slots: {piece.selected_slots.join(", ")}</p>
          ) : null}
          <div className="flex flex-wrap gap-2 pt-1">
            {(urlsByPiece[piece.id] ?? []).map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt="" className="h-16 w-16 rounded object-cover border border-[var(--gray-200)]" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
