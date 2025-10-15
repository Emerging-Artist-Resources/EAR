"use client"

import { Alert } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { OpportunitySubtype } from "../EventTypeSelector"

interface OpportunityStepProps {
  subtype: OpportunitySubtype
}

export function OpportunityStep({ subtype }: OpportunityStepProps) {
  return (
    <div className="space-y-4">
      <Alert variant="default">This section is a placeholder while we finalize schema for {subtype ?? 'Opportunities'}.</Alert>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <Input placeholder="Opportunity title" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
        <Textarea rows={4} placeholder="Details" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
        <Input placeholder="YYYY-MM-DD" />
      </div>
    </div>
  )
}


