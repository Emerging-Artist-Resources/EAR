import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { H3, Text } from "@/components/ui/typography";
import { SubmissionCard, type SubmissionItem } from "./SubmissionCard";
import PerformanceModal from "@/components/performance-modal";
import { useState } from "react";

export const MySubmissions = () => {
  const items: SubmissionItem[] = [
    {
      id: "1",
      name: "Event Name",
      type: "performance",
      submittedAt: "Month Day, Year",
      status: "approved",
      href: "/admin/events/1",
    },
    {
      id: "2",
      name: "Event Name",
      type: "performance",
      submittedAt: "Month Day, Year",
      status: "under_review",
      href: "/admin/events/2",
    },
  ]
  

  const [isModalOpen, setIsModalOpen] = useState(false)
  const handleSubmitPerformance = () => {
    setIsModalOpen(true)
  }

  return (
    <>
      <H3 className="mb-3">My Submissions</H3>
      <Card border="dashed" padding="md" className="space-y-3">
        
        {items.length === 0 ? (
          <>
            <div className="text-center text-gray-600">
              <Text className="text-sm">You haven’t submitted any events yet.</Text>
              <div className="mt-2">
                <Button variant="link" onClick={handleSubmitPerformance}>+ Submit New Listing</Button>
              </div>
              
            </div>
            <PerformanceModal
                  isOpen={isModalOpen}
                  onClose={() => setIsModalOpen(false)}
                  onSuccess={handleSubmitPerformance}
                />
          </>
        ) : (
          <>
            {items.map((it) => (
              <SubmissionCard key={it.id} item={it} />
            ))}
            <div className="text-center">
              <Button variant="link" onClick={handleSubmitPerformance}>+ Submit New Listing</Button>
              
            </div>
            <PerformanceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSubmitPerformance}
              />
          </>
        )}
      </Card>
    </>
  )
}