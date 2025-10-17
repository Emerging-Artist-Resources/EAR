import React from "react"
import { Button } from "@/components/ui/button"

export interface CallToActionProps {
  onSubmitPerformance?: () => void
}

export const CallToAction: React.FC<CallToActionProps> = ({ onSubmitPerformance }) => {
  return (
  <div className="mb-6 bg-gradient-to-r from-[var(--secondary-50)] to-[var(--secondary-100)] rounded-lg p-6 border border-primary/20">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Have an upcoming performance or event?
        </h2>
        <p className="text-gray-600 mb-4">
          Submit your performance details and we&apos;ll add it to the calendar after review.
        </p>
        <Button onClick={onSubmitPerformance}>
          Submit Performance
        </Button>
        
      </div>
    </div>
  )
}
