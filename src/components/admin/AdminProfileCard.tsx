"use client"

import { useState } from "react"
import { AdminProfileItem } from "./profile-types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { Text } from "@/components/ui/typography"

export function AdminProfileCard({
  profile,
  onUpdate,
}: {
  profile: AdminProfileItem
  onUpdate: (id: string, status: "emerging" | "established") => Promise<void>
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
              <div className="flex items-center gap-2">
                <Text className="text-sm text-[var(--gray-600)]">Current Status:</Text>
                <Badge
                  variant={profile.status === "established" ? "success" : "warning"}
                  size="sm"
                >
                  {profile.status}
                </Badge>
              </div>
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

