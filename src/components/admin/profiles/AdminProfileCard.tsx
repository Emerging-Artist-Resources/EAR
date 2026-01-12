"use client"

import { useState, useEffect } from "react"
import { AdminProfileItem, needsReview, AdminEligibilitySubmission } from "./profile-types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { Text } from "@/components/ui/typography"

export function AdminProfileCard({
  profile,
  onUpdate,
  onMarkReviewed,
}: {
  profile: AdminProfileItem
  onUpdate: (id: string, status: "emerging" | "established") => Promise<void>
  onMarkReviewed?: (id: string) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<"emerging" | "established">(profile.status)
  const [eligibilitySubmissions, setEligibilitySubmissions] = useState<AdminEligibilitySubmission[]>([])
  const [loadingEligibility, setLoadingEligibility] = useState(false)
  const [selectedSubmissionIndex, setSelectedSubmissionIndex] = useState(0)
  const [eligibilityExpanded, setEligibilityExpanded] = useState(false)

  useEffect(() => {
    if (open) {
      setLoadingEligibility(true)
      fetch(`/api/admin/profiles/${profile.id}/eligibility`)
        .then((res) => res.json())
        .then((json) => {
          const submissions = Array.isArray(json?.data) ? json.data as AdminEligibilitySubmission[] : []
          setEligibilitySubmissions(submissions)
          setSelectedSubmissionIndex(0)
        })
        .catch((error) => {
          console.error("Failed to fetch eligibility submissions:", error)
          setEligibilitySubmissions([])
        })
        .finally(() => {
          setLoadingEligibility(false)
        })
    }
  }, [open, profile.id])

  const handleUpdate = async () => {
    if (selectedStatus === profile.status) {
      setOpen(false)
      return
    }
    setUpdating(true)
    try {
      await onUpdate(profile.id, selectedStatus)
      setOpen(false)
    } catch (error) {
      console.error("Failed to update profile:", error)
      alert("Failed to update profile status")
    } finally {
      setUpdating(false)
    }
  }

  const formatBudgetRange = (range: string | null): string => {
    if (!range) return "—"
    const budgetMap: Record<string, string> = {
      r_0_24999: "$0 - $24,999",
      r_25000_49999: "$25,000 - $49,999",
      r_50000_99999: "$50,000 - $99,999",
      r_100000_499999: "$100,000 - $499,999",
      r_500000_999999: "$500,000 - $999,999",
      r_1000000_1999999: "$1,000,000 - $1,999,999",
      r_2000000_plus: "$2,000,000 +",
    }
    return budgetMap[range] || range
  }

  const formatYesNoOther = (value: string | null): string => {
    if (!value) return "—"
    return value === "yes" ? "Yes" : value === "no" ? "No" : value === "other" ? "Other" : value
  }

  const formatBoolean = (value: boolean | null): string => {
    if (value === null) return "—"
    return value ? "Yes" : "No"
  }

  const selectedSubmission = eligibilitySubmissions[selectedSubmissionIndex]

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          setSelectedStatus(profile.status)
          setOpen(true)
        }}
      >
        Update status
      </Button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Update Profile Status"
        headerClassName="bg-primary"
      >
        <div className="space-y-4">
          <div>
            <Text className="text-sm font-medium text-[var(--gray-700)] mb-2">Profile Information</Text>
            <div className="bg-[var(--gray-50)] rounded-md p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Text className="text-sm text-[var(--gray-600)]">Name:</Text>
                <Text className="text-sm font-medium">{profile.name || "—"}</Text>
              </div>
              <div className="flex items-center gap-2">
                <Text className="text-sm text-[var(--gray-600)]">Email:</Text>
                <Text className="text-sm font-medium">{profile.email || "—"}</Text>
              </div>
              {profile.profileType && (
                <div className="flex items-center gap-2">
                  <Text className="text-sm text-[var(--gray-600)]">Profile Type:</Text>
                  <Text className="text-sm font-medium capitalize">{profile.profileType}</Text>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Text className="text-sm text-[var(--gray-600)]">Current Status:</Text>
                <Badge
                  variant={profile.status === "established" ? "success" : "warning"}
                  size="sm"
                >
                  {profile.status}
                </Badge>
              </div>
              {profile.reviewedAt && (
                <div className="flex items-center gap-2">
                  <Text className="text-sm text-[var(--gray-600)]">Reviewed:</Text>
                  <Text className="text-sm font-medium">
                    {new Date(profile.reviewedAt).toLocaleString()}
                  </Text>
                </div>
              )}
              {needsReview(profile) && (
                <div className="flex items-center gap-2">
                  <Badge variant="warning" size="sm">Needs Review (New User)</Badge>
                </div>
              )}
            </div>
          </div>

          {eligibilitySubmissions.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setEligibilityExpanded(!eligibilityExpanded)}
                className="w-full flex items-center justify-between text-left"
              >
                <Text className="text-sm font-medium text-[var(--gray-700)]">
                  Emerging Artist Eligibility Form
                </Text>
                <Text className="text-sm text-[var(--gray-500)]">
                  {eligibilityExpanded ? "−" : "+"}
                </Text>
              </button>
              {eligibilityExpanded && (
                <div className="mt-2 bg-[var(--gray-50)] rounded-md p-4 space-y-4">
                  {eligibilitySubmissions.length > 1 && (
                    <div>
                      <Text className="text-sm text-[var(--gray-600)] mb-2">Version:</Text>
                      <div className="flex flex-wrap gap-2">
                        {eligibilitySubmissions.map((sub, index) => (
                          <Button
                            key={sub.id}
                            size="sm"
                            variant={selectedSubmissionIndex === index ? "primary" : "outline"}
                            onClick={() => setSelectedSubmissionIndex(index)}
                          >
                            v{sub.version} ({new Date(sub.created_at).toLocaleDateString()})
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedSubmission && (
                    <div className="space-y-3 pt-2 border-t border-[var(--gray-200)]">
                      <div className="flex items-center gap-2">
                        <Text className="text-sm text-[var(--gray-600)]">Suggested Status:</Text>
                        <Badge
                          variant={selectedSubmission.suggested_status === "established" ? "success" : "warning"}
                          size="sm"
                        >
                          {selectedSubmission.suggested_status || "—"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-start gap-2">
                          <Text className="text-sm text-[var(--gray-600)] min-w-[200px]">Self-identifies as emerging:</Text>
                          <Text className="text-sm font-medium">{formatBoolean(selectedSubmission.self_identifies_emerging)}</Text>
                        </div>
                        <div className="flex items-start gap-2">
                          <Text className="text-sm text-[var(--gray-600)] min-w-[200px]">Operating budget:</Text>
                          <Text className="text-sm font-medium">
                            {formatBudgetRange(selectedSubmission.operating_budget_range)}
                            {selectedSubmission.operating_budget_other_text && ` (${selectedSubmission.operating_budget_other_text})`}
                          </Text>
                        </div>
                        <div className="flex items-start gap-2">
                          <Text className="text-sm text-[var(--gray-600)] min-w-[200px]">Owns/operates venue:</Text>
                          <Text className="text-sm font-medium">
                            {formatYesNoOther(selectedSubmission.owns_or_operates_venue)}
                            {selectedSubmission.owns_or_operates_venue_other_text && ` (${selectedSubmission.owns_or_operates_venue_other_text})`}
                          </Text>
                        </div>
                        <div className="flex items-start gap-2">
                          <Text className="text-sm text-[var(--gray-600)] min-w-[200px]">Supported by major institution:</Text>
                          <Text className="text-sm font-medium">
                            {formatYesNoOther(selectedSubmission.supported_by_major_institution)}
                            {selectedSubmission.supported_by_major_institution_other_text && ` (${selectedSubmission.supported_by_major_institution_other_text})`}
                          </Text>
                        </div>
                        <div className="flex items-start gap-2">
                          <Text className="text-sm text-[var(--gray-600)] min-w-[200px]">Classes hosted independently:</Text>
                          <Text className="text-sm font-medium">
                            {formatYesNoOther(selectedSubmission.classes_hosted_independently)}
                            {selectedSubmission.classes_hosted_independently_other_text && ` (${selectedSubmission.classes_hosted_independently_other_text})`}
                          </Text>
                        </div>
                        <div className="flex items-start gap-2">
                          <Text className="text-sm text-[var(--gray-600)] min-w-[200px]">Has 501c3:</Text>
                          <Text className="text-sm font-medium">
                            {formatYesNoOther(selectedSubmission.has_501c3)}
                            {selectedSubmission.has_501c3_other_text && ` (${selectedSubmission.has_501c3_other_text})`}
                          </Text>
                        </div>
                        <div className="flex items-start gap-2">
                          <Text className="text-sm text-[var(--gray-600)] min-w-[200px]">Submitted:</Text>
                          <Text className="text-sm font-medium">
                            {new Date(selectedSubmission.created_at).toLocaleString()}
                          </Text>
                        </div>
                      </div>
                    </div>
                  )}
                  {loadingEligibility && (
                    <Text className="text-sm text-[var(--gray-600)]">Loading eligibility data...</Text>
                  )}
                </div>
              )}
            </div>
          )}

          <div>
            <Text className="text-sm font-medium text-[var(--gray-700)] mb-2">New Status</Text>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="emerging"
                  checked={selectedStatus === "emerging"}
                  onChange={() => setSelectedStatus("emerging")}
                  className="w-4 h-4 text-[var(--primary-600)]"
                />
                <Text>Emerging</Text>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="established"
                  checked={selectedStatus === "established"}
                  onChange={() => setSelectedStatus("established")}
                  className="w-4 h-4 text-[var(--primary-600)]"
                />
                <Text>Established</Text>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-[var(--gray-200)]">
            <Button
              onClick={handleUpdate}
              disabled={updating || selectedStatus === profile.status}
              variant="primary"
            >
              {updating ? "Updating…" : "Update Status"}
            </Button>
            {onMarkReviewed && needsReview(profile) && (
              <Button
                onClick={async () => {
                  try {
                    await onMarkReviewed(profile.id)
                    setOpen(false)
                  } catch (error) {
                    console.error("Failed to mark as reviewed:", error)
                    alert("Failed to mark as reviewed")
                  }
                }}
                variant="outline"
                disabled={updating}
                className="text-[var(--success-600)] border-[var(--success-300)] hover:bg-[var(--success-50)]"
              >
                ✓ Mark as Reviewed
              </Button>
            )}
            <Button
              onClick={() => setOpen(false)}
              variant="outline"
              disabled={updating}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

