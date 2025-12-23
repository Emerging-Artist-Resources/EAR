"use client"

import { useState } from "react"
import { AdminProfileItem, needsReview } from "./profile-types"
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

