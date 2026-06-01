import { getSupabaseServiceClient } from "@/lib/supabase/service"
import type { ServiceInquiryServiceDetail } from "./types"
import { ANALYTICS_SERVICE_INQUIRY_SERVICES } from "./service-inquiry-labels"

export async function getServiceInquiryByServiceRepo(options?: {
  createdFrom?: string
  createdBefore?: string
}): Promise<ServiceInquiryServiceDetail[]> {
  const svc = getSupabaseServiceClient()

  let inquiryQuery = svc.from("service_inquiries").select("service_slug")
  if (options?.createdFrom) inquiryQuery = inquiryQuery.gte("created_at", options.createdFrom)
  if (options?.createdBefore) inquiryQuery = inquiryQuery.lt("created_at", options.createdBefore)

  const { data: inquiries, error } = await inquiryQuery
  if (error) throw error

  const counts = new Map<string, number>()
  for (const { slug } of ANALYTICS_SERVICE_INQUIRY_SERVICES) {
    counts.set(slug, 0)
  }

  for (const row of inquiries ?? []) {
    const slug = row.service_slug as string
    if (counts.has(slug)) {
      counts.set(slug, (counts.get(slug) ?? 0) + 1)
    }
  }

  return ANALYTICS_SERVICE_INQUIRY_SERVICES.map(({ slug, label }) => ({
    slug,
    label,
    count: counts.get(slug) ?? 0,
  }))
}
