import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Tries to insert occurrences with a source column, falling back if the column doesn't exist
 */
export async function tryInsertWithSourceColumn(
  supabase: SupabaseClient,
  occurrences: Array<Record<string, any>>,
  sourceColumnName: string,
  sourceListingId: string,
): Promise<void> {
  const occurrencesWithSource = occurrences.map(occ => ({
    ...occ,
    [sourceColumnName]: sourceListingId,
  }))

  const { error: insertErrorWithSource } = await supabase
    .from("listing_occurrences")
    .insert(occurrencesWithSource)

  if (insertErrorWithSource) {
    if (insertErrorWithSource.message?.includes(sourceColumnName) || 
        insertErrorWithSource.message?.includes('column') ||
        insertErrorWithSource.code === '42703') {
      const { error: insertErrorWithoutSource } = await supabase
        .from("listing_occurrences")
        .insert(occurrences)
      
      if (insertErrorWithoutSource) {
        throw new Error(`Failed to add occurrences: ${insertErrorWithoutSource.message}`)
      }
    } else {
      throw insertErrorWithSource
    }
  }
}

/**
 * Tries to query occurrences with a source column filter, falling back if the column doesn't exist
 */
export async function tryQueryWithSourceFilter(
  supabase: SupabaseClient,
  listingId: string,
  sourceColumnName: string
): Promise<{ data: any[] | null; error: any }> {
  const { data: occurrencesWithFilter, error: filterError } = await supabase
    .from("listing_occurrences")
    .select("*")
    .eq("listing_id", listingId)
    .is(sourceColumnName, null)
  
  if (filterError) {
    const { data: occurrencesWithoutFilter, error: noFilterError } = await supabase
      .from("listing_occurrences")
      .select("*")
      .eq("listing_id", listingId)
    
    return { data: occurrencesWithoutFilter, error: noFilterError }
  }
  
  return { data: occurrencesWithFilter, error: null }
}
