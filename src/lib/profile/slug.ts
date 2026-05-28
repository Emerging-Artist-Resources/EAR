import type { SupabaseClient } from "@supabase/supabase-js"

/** URL-safe base slug from display name; falls back to user-{id prefix} when empty. */
export function profileSlugBaseFromName(name: string | null | undefined, userId: string): string {
  const raw = (name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  if (!raw) {
    return `user-${userId.replace(/-/g, "").slice(0, 12)}`
  }
  return raw.slice(0, 80)
}

/** Reserves a unique slug (tries base, then base-1, base-2, …). */
export async function pickUniqueProfileSlug(
  supabase: SupabaseClient,
  base: string,
): Promise<string> {
  const sanitizedBase = base.slice(0, 80)
  let n = 0
  for (;;) {
    const suffix = n === 0 ? "" : `-${n}`
    const maxBaseLen = Math.max(1, 80 - suffix.length)
    const candidate = `${sanitizedBase.slice(0, maxBaseLen)}${suffix}`
    const { data } = await supabase.from("profiles").select("id").eq("slug", candidate).maybeSingle()
    if (!data) return candidate
    n += 1
    if (n > 10_000) {
      throw new Error("Could not allocate unique profile slug")
    }
  }
}
