import React, { useState } from "react"
import { Card } from "@/components/ui/card"
import {  H3, Text } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export const MyInfoTab: React.FC = () => {
  // TODO: Replace with real profile data and wire API
  const [profile, setProfile] = useState({
    fullName: "John Doe",
    pronouns: "(he/him)",
    email: "john@gmail.com",
    address: "New York, NY",
    company: "https://website.com",
    website: "https://website.com",
    status: "Emerging",
  })
  const [draft, setDraft] = useState(profile)
  const [isEditing, setIsEditing] = useState(false)

  const Field = ({ label, value }: { label: string; value?: string | null }) => (
    <div className="space-y-1">
      <Text className="font-semibold text-gray-800">{label}</Text>
      <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
        {value || "—"}
      </div>
    </div>
  )

  return (
    <section className="mt-6">
      <Card border="dashed" padding="md" className="relative">
        <div className="mb-4 flex items-center justify-between">
          <H3 className="text-gray-900">Personal Info</H3>
          {!isEditing ? (
            <Button variant="secondary" onClick={() => { setDraft(profile); setIsEditing(true) }}>
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setProfile(draft) // TODO: call API
                  setIsEditing(false)
                }}
              >
                Save Changes
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setDraft(profile)
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
            <Field label="Full Name" value={profile.fullName} />
            <Field label="Pronouns" value={profile.pronouns} />
            <Field label="Email" value={profile.email} />
            <Field label="Address" value={profile.address} />
            <div className="md:col-span-2">
              <Field label="Company" value={profile.company} />
            </div>
            <div className="md:col-span-2">
              <Field label="Website" value={profile.website} />
            </div>
            <div className="md:col-span-2">
              <Field label="Emerging Artist Status" value={profile.status} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <Text className="font-semibold text-gray-800">Full Name</Text>
              <Input value={draft.fullName} onChange={(e) => setDraft({ ...draft, fullName: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Text className="font-semibold text-gray-800">Pronouns</Text>
              <Input value={draft.pronouns} onChange={(e) => setDraft({ ...draft, pronouns: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Text className="font-semibold text-gray-800">Email</Text>
              <Input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Text className="font-semibold text-gray-800">Address</Text>
              <Input value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
            </div>
            <div className="md:col-span-2 space-y-1">
              <Text className="font-semibold text-gray-800">Company</Text>
              <Input value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} />
            </div>
            <div className="md:col-span-2 space-y-1">
              <Text className="font-semibold text-gray-800">Website</Text>
              <Input value={draft.website} onChange={(e) => setDraft({ ...draft, website: e.target.value })} />
            </div>
            <div className="md:col-span-2 space-y-1">
              <Text className="font-semibold text-gray-800">Emerging Artist Status</Text>
              <Input value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })} />
            </div>
          </div>
        )}
      </Card>
    </section>
  )
}


