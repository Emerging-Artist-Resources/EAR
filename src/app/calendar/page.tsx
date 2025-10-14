"use client"

import { useState, useEffect } from "react"
import { CallToAction } from "@/components/layout/call-to-action"
import PerformanceModal from "@/components/performance-modal"
import { usePerformances } from "@/hooks/use-performances"
import { PERFORMANCE_STATUS } from "@/lib/constants"
import { Calendar } from "@/components/calendar/calendar"

export default function CalendarView() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { performances, loading, fetchPerformances } = usePerformances(PERFORMANCE_STATUS.APPROVED)

  useEffect(() => {
    fetchPerformances()
  }, [fetchPerformances])

  const handleModalSuccess = () => {
    fetchPerformances()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading calendar...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className={`px-4 py-6 sm:px-0 transition-opacity duration-200 ${isModalOpen ? 'opacity-50' : ''}`}>
          <CallToAction onSubmitPerformance={() => setIsModalOpen(true)} />
          <Calendar performances={performances} />
        </div>
      </div>
      <PerformanceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}