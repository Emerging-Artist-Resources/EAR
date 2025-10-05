"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns"
import { Header } from "@/components/layout/header"
import { CallToAction } from "@/components/layout/call-to-action"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import PerformanceModal from "@/components/performance-modal"
import { usePerformances } from "@/hooks/use-performances"
import { PERFORMANCE_STATUS, getStatusColor, formatDateTime } from "@/lib/constants"
import type { Performance } from "@/hooks/use-performances"

export default function CalendarView() {
  const { data: session } = useSession()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const { performances, loading, fetchPerformances } = usePerformances(PERFORMANCE_STATUS.APPROVED)

  useEffect(() => {
    fetchPerformances()
  }, [currentMonth, fetchPerformances])

  const handleModalSuccess = () => {
    fetchPerformances()
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  // Get the first day of the month to calculate padding
  const firstDayOfMonth = monthStart.getDay() // 0 = Sunday, 1 = Monday, etc.
  
  // Create empty cells for the beginning of the month
  const emptyCells = Array.from({ length: firstDayOfMonth }, (_, index) => null)

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentMonth(subMonths(currentMonth, 1))
    } else {
      setCurrentMonth(addMonths(currentMonth, 1))
    }
  }

  const getPerformancesForDate = (date: Date) => {
    return performances.filter(performance => {
      const performanceDate = new Date(performance.date)
      // Use date string comparison to avoid timezone issues
      const performanceDateStr = performanceDate.toDateString()
      const targetDateStr = date.toDateString()
      return performanceDateStr === targetDateStr
    })
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
                  <Header 
                    showSubmitButton={false}
                  />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className={`px-4 py-6 sm:px-0 transition-opacity duration-200 ${isModalOpen ? 'opacity-50' : ''}`}>
          <CallToAction onSubmitPerformance={() => setIsModalOpen(true)} />

          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date())}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-50"
                >
                  Today
                </button>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="bg-gray-50 py-2 text-center text-xs sm:text-sm font-medium text-gray-500">
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{day.charAt(0)}</span>
                </div>
              ))}
              
              {emptyCells.map((_, index) => (
                <div key={`empty-${index}`} className="bg-white min-h-[80px] sm:min-h-[120px]" />
              ))}
              
              {daysInMonth.map((day) => {
                const dayPerformances = getPerformancesForDate(day)
                const isToday = isSameDay(day, new Date())
                const isCurrentMonth = isSameMonth(day, currentMonth)
                
                return (
                  <div
                    key={day.toISOString()}
                    className={`bg-white p-1 sm:p-2 min-h-[80px] sm:min-h-[120px] cursor-pointer hover:bg-gray-50 ${
                      !isCurrentMonth ? 'text-gray-300' : ''
                    } ${isToday ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className={`text-xs sm:text-sm font-medium ${
                      isToday ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-300'
                    }`}>
                      {format(day, 'd')}
                    </div>
                    <div className="mt-1 space-y-1">
                      {dayPerformances.slice(0, 2).map((performance) => (
                        <div
                          key={performance.id}
                          className="text-xs bg-indigo-100 text-indigo-800 px-1 sm:px-2 py-0.5 sm:py-1 rounded truncate"
                          title={performance.title}
                        >
                          <span className="hidden sm:inline">{performance.title}</span>
                          <span className="sm:hidden">{performance.title.substring(0, 8)}...</span>
                        </div>
                      ))}
                      {dayPerformances.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{dayPerformances.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {selectedDate && (
            <Card className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Performances on {format(selectedDate, "MMMM d, yyyy")}
              </h3>
              {getPerformancesForDate(selectedDate).length === 0 ? (
                <p className="text-gray-500">No performances scheduled for this date.</p>
              ) : (
                <div className="space-y-4">
                  {getPerformancesForDate(selectedDate).map((performance) => (
                    <Card key={performance.id} padding="sm">
                      <h4 className="text-lg font-medium text-gray-900">
                        {performance.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        <strong>Performer:</strong> {performance.performer}
                      </p>
                      {performance.time && (
                        <p className="text-sm text-gray-600">
                          <strong>Time:</strong> {performance.time}
                        </p>
                      )}
                      {performance.location && (
                        <p className="text-sm text-gray-600">
                          <strong>Location:</strong> {performance.location}
                        </p>
                      )}
                      {performance.description && (
                        <p className="text-sm text-gray-600 mt-2">
                          <strong>Description:</strong> {performance.description}
                        </p>
                      )}
                      {(performance.contactEmail || performance.contactPhone) && (
                        <p className="text-sm text-gray-500 mt-2">
                          <strong>Contact:</strong> {performance.contactEmail} {performance.contactPhone}
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          )}
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