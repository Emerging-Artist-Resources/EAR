/**
 * Organizer split bill / festival: embedded program pieces stored in
 * performance_details.organizer_program_pieces (JSONB).
 */

export const ORGANIZER_PROGRAM_PIECES_VERSION = 1 as const

export type OrganizerProgramPiecePhoto = {
  path: string
  sort_order: number
  credit?: string | null
  /** Ephemeral signed URL from listing API (not persisted). */
  url?: string | null
}

export type OrganizerProgramPiecePersisted = {
  id: string
  company: string
  company_website: string | null
  title: string
  choreographer: string | null
  description: string
  credits: string | null
  selected_slots: string[] | null
  piece_schedule_mode: string | null
  /** Custom piece dates (same shape as form extraOccurrences rows) when used */
  extra_occurrences: unknown[] | null
  photos: OrganizerProgramPiecePhoto[]
}

export type OrganizerProgramPiecesDocument = {
  version: typeof ORGANIZER_PROGRAM_PIECES_VERSION
  pieces: OrganizerProgramPiecePersisted[]
}

export function pieceFieldPrefix(index: number): string {
  return index === 0 ? "piece" : `pieces.${index}`
}

export function piecePromoFilesFieldName(index: number): string {
  return `${pieceFieldPrefix(index)}_promoFiles`
}

export function pieceIdFieldName(index: number): string {
  return `${pieceFieldPrefix(index)}_id`
}

function readStr(data: Record<string, unknown>, key: string): string {
  const v = data[key]
  return typeof v === "string" ? v : ""
}

function readStrOrNull(data: Record<string, unknown>, key: string): string | null {
  const v = data[key]
  if (v == null) return null
  if (typeof v !== "string") return null
  const t = v.trim()
  return t === "" ? null : t
}

function readStringArray(data: Record<string, unknown>, key: string): string[] | null {
  const v = data[key]
  if (!Array.isArray(v)) return null
  const out = v.filter((x): x is string => typeof x === "string" && x.trim() !== "")
  return out.length ? out : null
}

function readUnknownArray(data: Record<string, unknown>, key: string): unknown[] | null {
  const v = data[key]
  if (!Array.isArray(v) || v.length === 0) return null
  return v
}

/** Infer number of piece rows from `pieces` field array length (useFieldArray) or first-piece-only legacy. */
export function inferOrganizerPieceCount(data: Record<string, unknown>): number {
  const raw = data.pieces
  if (Array.isArray(raw) && raw.length > 0) return raw.length
  const addPiece = data.addPiece === true || data.addPiece === "true"
  if (addPiece && (readStr(data, "piece_company").trim() !== "" || readStr(data, "piece_title").trim() !== "")) {
    return 1
  }
  return 0
}

/**
 * Build persisted document from flat form keys (photos always empty — client merges uploads after).
 */
export function buildOrganizerProgramPiecesDocumentFromForm(
  data: Record<string, unknown>
): OrganizerProgramPiecesDocument | null {
  const n = inferOrganizerPieceCount(data)
  if (n === 0) return null

  const pieces: OrganizerProgramPiecePersisted[] = []
  for (let i = 0; i < n; i++) {
    const p = pieceFieldPrefix(i)
    let id = readStr(data, `${p}_id`).trim()
    if (!id) {
      // Should be set by append(); avoid silent bad state
      if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        id = crypto.randomUUID()
      } else {
        id = `${Date.now()}-${i}`
      }
    }
    pieces.push({
      id,
      company: readStr(data, `${p}_company`).trim(),
      company_website: readStrOrNull(data, `${p}_companyWebsite`),
      title: readStr(data, `${p}_title`).trim(),
      choreographer: readStrOrNull(data, `${p}_choreographer`),
      description: readStr(data, `${p}_description`).trim(),
      credits: readStrOrNull(data, `${p}_credits`),
      selected_slots: readStringArray(data, `${p}_selectedSlots`),
      piece_schedule_mode: readStrOrNull(data, `${p}_pieceScheduleMode`),
      extra_occurrences: readUnknownArray(data, `${p}_extraOccurrences`),
      photos: [],
    })
  }

  return { version: ORGANIZER_PROGRAM_PIECES_VERSION, pieces }
}

export function extractPiecePhotosByIdFromDocument(
  doc: unknown
): Record<string, OrganizerProgramPiecePhoto[]> {
  if (!doc || typeof doc !== "object") return {}
  const o = doc as OrganizerProgramPiecesDocument
  if (o.version !== 1 || !Array.isArray(o.pieces)) return {}
  const out: Record<string, OrganizerProgramPiecePhoto[]> = {}
  for (const piece of o.pieces) {
    if (!piece?.id || typeof piece.id !== "string") continue
    if (Array.isArray(piece.photos) && piece.photos.length > 0) {
      out[piece.id] = piece.photos
        .filter((ph) => ph && typeof ph.path === "string")
        .map((ph, idx) => ({
          path: ph.path,
          sort_order: typeof ph.sort_order === "number" ? ph.sort_order : idx,
          credit: ph.credit ?? null,
        }))
    }
  }
  return out
}

export function normalizeOrganizerProgramPiecesFromDb(raw: unknown): OrganizerProgramPiecesDocument | null {
  if (raw == null) return null
  if (typeof raw !== "object") return null
  const doc = raw as Partial<OrganizerProgramPiecesDocument>
  if (doc.version !== 1 || !Array.isArray(doc.pieces)) return null
  return doc as OrganizerProgramPiecesDocument
}

function extraOccurrencesHasRealRows(extra: unknown): boolean {
  if (!Array.isArray(extra) || extra.length === 0) return false
  return extra.some(
    (d) =>
      d &&
      typeof d === "object" &&
      "date" in d &&
      typeof (d as { date?: string }).date === "string" &&
      (d as { date: string }).date.trim() !== "" &&
      Array.isArray((d as { times?: unknown }).times) &&
      (d as { times: Array<{ time?: string }> }).times.length > 0 &&
      (d as { times: Array<{ time?: string }> }).times.some((t) => t?.time && String(t.time).trim() !== "")
  )
}

/** Organizer multi-program: piece has slot selection and/or custom occurrences. */
export function organizerPieceHasSchedule(data: Record<string, unknown>, index: number): boolean {
  const p = pieceFieldPrefix(index)
  const slots = data[`${p}_selectedSlots`]
  const hasSlots = Array.isArray(slots) && slots.length > 0
  return hasSlots || extraOccurrencesHasRealRows(data[`${p}_extraOccurrences`])
}
