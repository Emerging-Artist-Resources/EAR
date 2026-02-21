import { getSupabaseServiceClient } from "@/lib/supabase/service"
import { normalizeSupabaseRelation } from "./admin-utils"

export async function searchParentEventsRepo(params: {
  query: string
  limit?: number
}) {
  const svc = getSupabaseServiceClient()
  const limit = params.limit ?? 20
  const queryLower = params.query.toLowerCase().trim()
  
  const { data, error } = await svc
    .from("listings")
    .select(`
      id,
      performance_details!inner (title, subtype)
    `)
    .eq("performance_details.subtype", "ORGANIZER")
    .is("deleted_at", null)
  
  if (error) throw error
  
  const filtered = (data ?? [])
    .map((item: any) => {
      const perfDetails = normalizeSupabaseRelation(item.performance_details)
      return {
        id: item.id,
        title: perfDetails?.title || "Untitled",
        perfDetails,
      }
    })
    .filter((item) => {
      return item.title.toLowerCase().includes(queryLower)
    })
    .sort((a: { title: string }, b: { title: string }) => a.title.localeCompare(b.title))
    .slice(0, limit)
  
  return filtered.map((item) => ({
    id: item.id,
    title: item.title,
  }))
}

export async function searchParentWorkshopsRepo(params: {
  query: string
  limit?: number
}) {
  const svc = getSupabaseServiceClient()
  const limit = params.limit ?? 20
  const queryLower = params.query.toLowerCase().trim()
  
  const { data, error } = await svc
    .from("listings")
    .select(`
      id,
      class_workshop_details!class_workshop_details_listing_id_fkey!inner (title, class_workshop_type)
    `)
    .eq("class_workshop_details.class_workshop_type", "WORKSHOP")
    .is("deleted_at", null)
  
  if (error) throw error
  
  const filtered = (data ?? [])
    .map((item: any) => {
      const classDetails = normalizeSupabaseRelation(item.class_workshop_details)
      return {
        id: item.id,
        title: classDetails?.title || "Untitled",
        classDetails,
      }
    })
    .filter((item) => {
      return item.title.toLowerCase().includes(queryLower)
    })
    .sort((a: { title: string }, b: { title: string }) => a.title.localeCompare(b.title))
    .slice(0, limit)
  
  return filtered.map((item) => ({
    id: item.id,
    title: item.title,
  }))
}
