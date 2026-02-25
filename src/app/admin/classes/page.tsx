"use client"

import { useState, useEffect, useCallback } from "react"
import { AdminLayout } from "@/components/admin/shared/AdminLayout"
import { ClassList } from "@/components/admin/classes/ClassList"
import { ClassLinkModal } from "@/components/admin/classes/ClassLinkModal"
import { ClassNeedingLink } from "@/components/admin/classes/types"
import { AdminLoadingState } from "@/components/admin/shared/AdminLoadingState"
import { H1 } from "@/components/ui/typography"

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<ClassNeedingLink[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState<ClassNeedingLink | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchClasses = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/classes")
      if (!response.ok) throw new Error("Failed to fetch classes")
      const json = await response.json()
      setClasses(json.data || [])
    } catch (error) {
      console.error("Error fetching classes:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  const handleLinkClick = (classItem: ClassNeedingLink) => {
    setSelectedClass(classItem)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedClass(null)
  }

  const handleSuccess = () => {
    fetchClasses()
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <H1>Link Classes to Parent Workshops</H1>
          <p className="text-gray-600 mt-2">
            Link classes to existing parent workshops or create minimal parent workshops for classes that reference parents that don't exist yet.
          </p>
        </div>

        {loading ? (
          <AdminLoadingState />
        ) : (
          <>
            <ClassList classes={classes} onLinkClick={handleLinkClick} />
            {selectedClass && (
              <ClassLinkModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                classItem={selectedClass}
                onSuccess={handleSuccess}
              />
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}
