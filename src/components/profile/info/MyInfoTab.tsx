import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import {  H3, Text } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiGet } from "@/lib/fetch-utils"

interface ProfileData {
  id: string;
  name: string | null;
  email: string | null;
  pronouns: string | null;
  website: string | null;
  organization_name: string | null;
  location_label: string | null;
  artist_status: string | null;
}

export const MyInfoTab: React.FC = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState<ProfileData | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await apiGet<ProfileData>("/api/profile")
        setProfile(data)
        setDraft(data)
      } catch (error) {
        console.error("Error fetching profile:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const Field = ({ label, value }: { label: string; value?: string | null }) => (
    <div className="space-y-1">
      <Text className="font-semibold text-gray-800">{label}</Text>
      <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
        {value || "—"}
      </div>
    </div>
  )

  if (loading) {
    return (
      <section className="mt-6">
        <Card border="dashed" padding="md">
          <Text>Loading profile...</Text>
        </Card>
      </section>
    )
  }

  if (!profile || !draft) {
    return (
      <section className="mt-6">
        <Card border="dashed" padding="md">
          <Text>Profile not found</Text>
        </Card>
      </section>
    )
  }

  const formatStatus = (status: string | null) => {
    if (!status) return null;
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  return (
    <section className="mt-6">
      <Card border="dashed" padding="md" className="relative">
        <div className="mb-4 flex items-center justify-between">
          <H3 className="text-gray-900">Personal Info</H3>
          {!isEditing ? (
            <Button variant="secondary" onClick={() => { setDraft({ ...profile }); setIsEditing(true) }}>
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setProfile(draft)
                  setIsEditing(false)
                }}
              >
                Save Changes
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setDraft({ ...profile })
                  setIsEditing(false)
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        {!isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Full Name" value={profile.name} />
            <Field label="Pronouns" value={profile.pronouns} />
            <Field label="Email" value={profile.email} />
            <Field label="Location" value={profile.location_label} />
            <div className="md:col-span-2">
              <Field label="Organization" value={profile.organization_name} />
            </div>
            <div className="md:col-span-2">
              <Field label="Website" value={profile.website} />
            </div>
            <div className="md:col-span-2">
              <Field label="Emerging Artist Status" value={formatStatus(profile.artist_status)} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <Text className="font-semibold text-gray-800">Full Name</Text>
              <Input value={draft.name || ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Text className="font-semibold text-gray-800">Pronouns</Text>
              <Input value={draft.pronouns || ""} onChange={(e) => setDraft({ ...draft, pronouns: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Text className="font-semibold text-gray-800">Email</Text>
              <Input type="email" value={draft.email || ""} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Text className="font-semibold text-gray-800">Location</Text>
              <Input value={draft.location_label || ""} onChange={(e) => setDraft({ ...draft, location_label: e.target.value })} />
            </div>
            <div className="md:col-span-2 space-y-1">
              <Text className="font-semibold text-gray-800">Organization</Text>
              <Input value={draft.organization_name || ""} onChange={(e) => setDraft({ ...draft, organization_name: e.target.value })} />
            </div>
            <div className="md:col-span-2 space-y-1">
              <Text className="font-semibold text-gray-800">Website</Text>
              <Input value={draft.website || ""} onChange={(e) => setDraft({ ...draft, website: e.target.value })} />
            </div>
            <div className="md:col-span-2 space-y-1">
              <Text className="font-semibold text-gray-800">Emerging Artist Status</Text>
              <Input value={formatStatus(draft.artist_status) || ""} disabled />
            </div>
          </div>
        )}
      </Card>
    </section>
  )
}


