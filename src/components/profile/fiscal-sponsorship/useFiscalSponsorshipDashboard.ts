"use client"

import { useCallback, useEffect, useState } from "react"
import { apiGet } from "@/lib/client/fetch-utils"
import type { FiscalSponsorshipDashboard } from "@/features/profile/server/types"
import { fiscalSponsorshipDashboardPath } from "@/lib/profile/fiscal-sponsorship-query"
import type { DonationDateRange } from "./DonationDateFilter"

export function useFiscalSponsorshipDashboard() {
  const [data, setData] = useState<FiscalSponsorshipDashboard | null>(null)
  const [page, setPage] = useState(0)
  const [dateFrom, setDateFrom] = useState<string | undefined>()
  const [dateTo, setDateTo] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (requestPage: number, from?: string, to?: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiGet<FiscalSponsorshipDashboard>(
        fiscalSponsorshipDashboardPath({
          page: requestPage,
          dateFrom: from,
          dateTo: to,
        }),
      )
      setData(result)
      setPage(result.page)
    } catch (err) {
      setData(null)
      setError(err instanceof Error ? err.message : "Failed to load fiscal sponsorship data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(page, dateFrom, dateTo)
  }, [load, page, dateFrom, dateTo])

  const setDateRange = useCallback((range: DonationDateRange) => {
    setDateFrom(range.from)
    setDateTo(range.to)
    setPage(0)
  }, [])

  return {
    data,
    loading,
    error,
    dateFrom,
    dateTo,
    setPage,
    setDateRange,
    reload: () => {
      void load(page, dateFrom, dateTo)
    },
  }
}
