"use server"

import { createClient } from "@supabase/supabase-js"

const BUCKET = "event-photos"

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase URL/SERVICE_ROLE_KEY missing")
  return createClient(url, key)
}

export async function uploadEventPhoto(opts: {
  eventId: string
  file: Blob
  filename: string
}): Promise<{ path: string; publicUrl?: string }> {
  const supabase = getAdminClient()
  const ts = Date.now()
  const path = `events/${opts.eventId}/${ts}-${opts.filename}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, opts.file, {
    upsert: false,
    cacheControl: "3600",
    contentType: (opts.file as any).type || undefined,
  })
  if (error) throw error
  return { path, publicUrl: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl }
}

export function getPublicUrl(path: string): string {
  const supabase = getAdminClient()
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

export async function getSignedUrl(path: string, expiresInSeconds = 60): Promise<string> {
  const supabase = getAdminClient()
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresInSeconds)
  if (error) throw error
  return data.signedUrl
}


