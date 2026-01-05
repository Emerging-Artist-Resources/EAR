import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { H3, Text } from "@/components/ui/typography";
import { SubmissionCard, type SubmissionItem } from "./SubmissionCard";
import PerformanceModal from "@/components/performance-modal";
import { useState, useEffect } from "react";
import { apiGet } from "@/lib/fetch-utils";

interface EligibilitySubmission {
  id: string;
  profile_id: string;
  suggested_status: string | null;
  decision: string | null;
  final_status: string | null;
  reviewed_at: string | null;
  created_at: string;
  version: number;
}

export const MySubmissions = () => {
  const [items, setItems] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function fetchSubmissions() {
      try {
        const submissions = await apiGet<EligibilitySubmission[]>("/api/profile/eligibility");
        
        const mappedItems: SubmissionItem[] = submissions.map((sub) => {
          const status = sub.final_status || sub.decision || sub.suggested_status || "pending";
          const statusMap: Record<string, SubmissionItem["status"]> = {
            approved: "approved",
            rejected: "rejected",
            pending: "pending",
            emerging: "under_review",
            established: "under_review",
          };
          
          const date = new Date(sub.created_at);
          const formattedDate = date.toLocaleDateString("en-US", { 
            year: "numeric", 
            month: "long", 
            day: "numeric" 
          });

          return {
            id: sub.id,
            name: `Eligibility Submission v${sub.version}`,
            type: "funding" as const,
            submittedAt: formattedDate,
            status: statusMap[status.toLowerCase()] || "pending",
            href: "#",
          };
        });
        
        setItems(mappedItems);
      } catch (error) {
        console.error("Error fetching submissions:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSubmissions();
  }, []);

  const handleSubmitPerformance = () => {
    setIsModalOpen(true);
  }

  return (
    <>
      <H3 className="mb-3">My Submissions</H3>
      <Card border="dashed" padding="md" className="space-y-3">
        {loading ? (
          <div className="text-center text-gray-600">
            <Text className="text-sm">Loading submissions...</Text>
          </div>
        ) : items.length === 0 ? (
          <>
            <div className="text-center text-gray-600">
              <Text className="text-sm">You haven't submitted any eligibility applications yet.</Text>
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