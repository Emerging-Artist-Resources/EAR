const ADMIN_NOTES_MARKER = /Admin notes:\s*([\s\S]*?)(?=\n\nAdmin notes:|$)/g
const ADMIN_NOTES_BLOCK = /(\n\n|^)Admin notes:\s*[\s\S]*?(?=\n\nAdmin notes:|$)/g

function parseAdminNoteSections(notes: string): string[] {
  return [...notes.matchAll(ADMIN_NOTES_MARKER)]
    .map((match) => match[1].trim())
    .filter(Boolean)
}

/** Appends reviewer feedback to `listings.notes` on approve/reject. */
export function appendAdminNotes(
  existingNotes: string | null | undefined,
  adminNotes: string
): string {
  const trimmed = adminNotes.trim()
  if (!trimmed) return existingNotes?.trim() ?? ""

  return existingNotes?.trim()
    ? `${existingNotes.trim()}\n\nAdmin notes: ${trimmed}`
    : `Admin notes: ${trimmed}`
}

/** Extracts all reviewer feedback appended to `listings.notes`. */
export function extractAdminNotes(notes: string | null | undefined): string | null {
  if (!notes?.trim()) return null

  const sections = parseAdminNoteSections(notes)
  return sections.length > 0 ? sections.join("\n\n") : null
}

/** Returns the most recent reviewer comment (for resubmitted listings). */
export function extractLatestAdminNotes(notes: string | null | undefined): string | null {
  if (!notes?.trim()) return null

  const sections = parseAdminNoteSections(notes)
  return sections.length > 0 ? sections[sections.length - 1]! : null
}

/** Returns user-submitted notes with reviewer feedback stripped out. */
export function stripAdminNotes(notes: string | null | undefined): string | null {
  if (!notes?.trim()) return null

  const stripped = notes.replace(ADMIN_NOTES_BLOCK, "").trim()
  return stripped || null
}
