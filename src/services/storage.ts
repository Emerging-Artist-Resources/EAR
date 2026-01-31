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

  /**
   * Copy a file from one bucket to another
   * @param client Supabase client
   * @param fromBucket Source bucket name
   * @param toBucket Destination bucket name
   * @param path File path (same in both buckets)
   * @returns The copied file data
   */
  async copyFile(client: SupabaseClient, fromBucket: string, toBucket: string, path: string) {
    // Download from source bucket
    const { data: fileData, error: downloadError } = await client.storage
      .from(fromBucket)
      .download(path)
    
    if (downloadError) throw new Error(`Failed to download from ${fromBucket}: ${downloadError.message}`)
    if (!fileData) throw new Error(`No file data returned from ${fromBucket}`)

    // Upload to destination bucket
    const { data: uploadData, error: uploadError } = await client.storage
      .from(toBucket)
      .upload(path, fileData, { upsert: true })
    
    if (uploadError) throw new Error(`Failed to upload to ${toBucket}: ${uploadError.message}`)
    
    return uploadData
  },

  /**
   * Move a file from one bucket to another (copy then delete)
   * @param client Supabase client
   * @param fromBucket Source bucket name
   * @param toBucket Destination bucket name
   * @param path File path (same in both buckets)
   * @returns The moved file data
   */
  async moveFile(client: SupabaseClient, fromBucket: string, toBucket: string, path: string) {
    // Copy first
    const result = await this.copyFile(client, fromBucket, toBucket, path)
    
    // Then delete from source
    const { error: deleteError } = await client.storage
      .from(fromBucket)
      .remove([path])
    
    if (deleteError) {
      // Log but don't throw - file is already in destination
      console.warn(`Failed to delete ${path} from ${fromBucket} after move:`, deleteError)
    }
    
    return result
  },
}


