"use client"

import { useState, useEffect } from "react"
import {
  AdminProfileItem,
  needsReview,
  AdminEligibilitySubmission,
  FISCAL_STATUS_BADGE,
  FiscalSponsorshipStatus,
} from "./profile-types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { Text } from "@/components/ui/typography"
import { ADMIN_LIGHT_SURFACE } from "@/components/admin/shared/admin-light-surface"

export function AdminProfileCard({
  profile,
  onUpdate,
}: {
  profile: AdminProfileItem
  onUpdate: (
    id: string,
    updates:
      | { status: "emerging" | "established" }
      | { fiscalSponsorshipStatus: FiscalSponsorshipStatus; fiscalSponsorshipNote?: string },
  ) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<"emerging" | "established">(profile.status)
  const [selectedFiscalStatus, setSelectedFiscalStatus] = useState<FiscalSponsorshipStatus>(
    profile.fiscalSponsorshipStatus,
  )
  const [fiscalNote, setFiscalNote] = useState(profile.fiscalSponsorshipNote || "")
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
    const artistStatusChanged = selectedStatus !== profile.status
    const fiscalStatusChanged = selectedFiscalStatus !== profile.fiscalSponsorshipStatus
    const fiscalNoteRequired = selectedFiscalStatus === "paused" || selectedFiscalStatus === "revoked"

    if (!artistStatusChanged && !fiscalStatusChanged) {
      setOpen(false)
      return
    }
    if (fiscalStatusChanged && fiscalNoteRequired && !fiscalNote.trim()) {
      alert("Fiscal sponsorship note is required when status is paused or revoked.")
      return
    }
    setUpdating(true)
    try {
      if (artistStatusChanged) {
        await onUpdate(profile.id, { status: selectedStatus })
      }
      if (fiscalStatusChanged) {
        await onUpdate(profile.id, {
          fiscalSponsorshipStatus: selectedFiscalStatus,
          fiscalSponsorshipNote: fiscalNote.trim() || undefined,
        })
      }
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
          setSelectedFiscalStatus(profile.fiscalSponsorshipStatus)
          setFiscalNote(profile.fiscalSponsorshipNote || "")
          setOpen(true)
        }}
      >
        Update status
      </Button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Update Profile Status"
        headerClassName="bg-primary text-primary-foreground"
        contentClassName="bg-[var(--surface-panel)] border-[var(--border-default)] text-[var(--gray-900)]"
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
              <div className="flex items-center gap-2">
                <Text className="text-sm text-[var(--gray-600)]">Fiscal Sponsorship:</Text>
                <Badge size="sm" className={FISCAL_STATUS_BADGE[profile.fiscalSponsorshipStatus]}>
                  {profile.fiscalSponsorshipStatus}
                </Badge>
              </div>
              {profile.fiscalSponsorshipApprovedAt && (
                <div className="flex items-center gap-2">
                  <Text className="text-sm text-[var(--gray-600)]">Last Approved:</Text>
                  <Text className="text-sm font-medium">
                    {new Date(profile.fiscalSponsorshipApprovedAt).toLocaleString()}
                  </Text>
                </div>
              )}
              {profile.fiscalSponsorshipNote && (
                <div className="flex items-start gap-2">
                  <Text className="text-sm text-[var(--gray-600)]">Fiscal Note:</Text>
                  <Text className="text-sm font-medium">{profile.fiscalSponsorshipNote}</Text>
                </div>
              )}
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
                className="w-full flex items-center justify-between gap-2 rounded-md py-2 text-left hover:bg-[var(--gray-100)]/80 transition-colors"
              >
                <span className="text-sm font-medium text-[var(--gray-800)]">
                  Emerging Artist Eligibility Form
                </span>
                <span className="text-sm tabular-nums text-[var(--gray-600)] shrink-0">
                  {eligibilityExpanded ? "−" : "+"}
                </span>
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
                <span className="text-sm text-[var(--gray-900)]">Emerging</span>
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
                <span className="text-sm text-[var(--gray-900)]">Established</span>
              </label>
            </div>
          </div>

          <div>
            <Text className="text-sm font-medium text-[var(--gray-700)] mb-2">Fiscal Sponsorship Status</Text>
            <div className="space-y-2">
              {(["none", "pending", "approved", "paused", "revoked"] as const).map((status) => (
                <label key={status} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="fiscalStatus"
                    value={status}
                    checked={selectedFiscalStatus === status}
                    onChange={() => setSelectedFiscalStatus(status)}
                    className="w-4 h-4 text-[var(--primary-600)]"
                  />
                  <span className="text-sm text-[var(--gray-900)] capitalize">{status}</span>
                </label>
              ))}
            </div>
            <div className="mt-3">
              <Text className="text-sm font-medium text-[var(--gray-700)] mb-2">
                Fiscal sponsorship note
                {(selectedFiscalStatus === "paused" || selectedFiscalStatus === "revoked") && " (required)"}
              </Text>
              <textarea
                value={fiscalNote}
                onChange={(e) => setFiscalNote(e.target.value)}
                rows={3}
                className={`w-full rounded-md border border-[var(--gray-300)] px-3 py-2 text-sm ${ADMIN_LIGHT_SURFACE}`}
                placeholder="Add context for this fiscal sponsorship status change"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-[var(--gray-200)]">
            <Button
              onClick={handleUpdate}
              disabled={
                updating ||
                (selectedStatus === profile.status && selectedFiscalStatus === profile.fiscalSponsorshipStatus)
              }
              variant="primary"
            >
              {updating ? "Updating…" : "Update Status"}
            </Button>
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

