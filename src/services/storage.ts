import { SupabaseClient } from "@supabase/supabase-js"

// Provider-agnostic surface; currently backed by Supabase
export const storageService = {
  async uploadFile(client: SupabaseClient, bucket: string, path: string, file: File, options?: {
    cacheControl?: string
    upsert?: boolean
  }) {
    const { data, error } = await client.storage
      .from(bucket)
      .upload(path, file, options)
    if (error) throw error
    return data
  },

  getPublicUrl(client: SupabaseClient, bucket: string, path: string) {
    const { data } = client.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  },

  async createSignedUrl(client: SupabaseClient, bucket: string, path: string, expiresIn: number) {
    const { data, error } = await client.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)
    if (error) throw error
    return data.signedUrl
  },
}


