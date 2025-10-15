"use client"

import { Alert } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export function ClassWorkshopStep() {
  return (
    <div className="space-y-4">
      <Alert variant="default">This section is a placeholder while we finalize schema for Classes/Workshops.</Alert>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">What’s your class/workshop called?</label>
        <Input placeholder="Title" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Overview</label>
        <Textarea rows={4} placeholder="Details" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Dates</label>
        <Input placeholder="YYYY-MM-DD" />
      </div>
    </div>
  )
}


