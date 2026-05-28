import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import {  H3, Text } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiGet, apiPatch } from "@/lib/client/fetch-utils"
import { useForm } from "@/lib/vendor/react-hook-form-zod"
import { zodResolver } from "@/lib/vendor/react-hook-form-zod"
import { updateProfileSchema, type UpdateProfileData } from "@/lib/validations/profile"
import { TextField } from "@/components/forms/blocks/TextField"
import { LocationField } from "@/components/forms/blocks/LocationField"

interface ProfileData {
  id: string;
  name: string | null;
  email: string | null;
  pronouns: string | null;
  website: string | null;
  organization_name: string | null;
  location_place_id: string | null;
  location_label: string | null;
  artist_status: string | null;
}

export const MyInfoTab: React.FC = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const form = useForm<UpdateProfileData>({
    resolver: zodResolver(updateProfileSchema),
    mode: "onChange",
    reValidateMode: "onChange",
  })

  const fetchProfile = async () => {
    try {
      const data = await apiGet<ProfileData>("/api/profile")
      setProfile(data)
      form.reset({
        name: data.name || undefined,
        email: data.email || undefined,
        pronouns: data.pronouns,
        website: data.website,
        organization_name: data.organization_name,
        location_place_id: data.location_place_id,
        location_label: data.location_label,
      })
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleSave = async (data: UpdateProfileData) => {
    setSaveError(null)

    try {
      const updatedProfile = await apiPatch<ProfileData>("/api/profile", data)
      setProfile(updatedProfile)
      form.reset({
        name: updatedProfile.name || undefined,
        email: updatedProfile.email || undefined,
        pronouns: updatedProfile.pronouns,
        website: updatedProfile.website,
        organization_name: updatedProfile.organization_name,
        location_place_id: updatedProfile.location_place_id,
        location_label: updatedProfile.location_label,
      })
      setIsEditing(false)
    } catch (error) {
      console.error("Error saving profile:", error)
      setSaveError(error instanceof Error ? error.message : "Failed to save profile")
    }
  }

  const handleCancel = () => {
    if (profile) {
      form.reset({
        name: profile.name || undefined,
        email: profile.email || undefined,
        pronouns: profile.pronouns,
        website: profile.website,
        organization_name: profile.organization_name,
        location_place_id: profile.location_place_id,
        location_label: profile.location_label,
      })
    }
    setIsEditing(false)
    setSaveError(null)
  }

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
      <section>
        <Card border="dashed" padding="md">
          <Text>Loading profile...</Text>
        </Card>
      </section>
    )
  }

  if (!profile) {
    return (
      <section>
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
    <section>
      <Card border="dashed" padding="md" className="relative">
        <div className="mb-4 flex items-center justify-between">
          <H3 className="text-gray-900">Personal Info</H3>
          {!isEditing ? (
            <Button variant="secondary" className="hover:text-ear-dark-red" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={form.handleSubmit(handleSave)}
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="ghost"
                onClick={handleCancel}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        {saveError && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {saveError}
          </div>
        )}

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
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <TextField form={form} name="name" label="Full Name" />
              <TextField form={form} name="pronouns" label="Pronouns" />
              <TextField form={form} name="email" label="Email" type="email" />
              <div className="md:col-span-2">
                <LocationField
                  form={form}
                  addressName="location_label"
                  placeIdName="location_place_id"
                  label="Location"
                />
              </div>
              <div className="md:col-span-2">
                <TextField form={form} name="organization_name" label="Organization" />
              </div>
              <div className="md:col-span-2">
                <TextField form={form} name="website" label="Website" type="url" />
              </div>
              <div className="md:col-span-2 space-y-1">
                <Text className="font-semibold text-gray-800">Emerging Artist Status</Text>
                <Input value={formatStatus(profile.artist_status) || ""} disabled />
              </div>
            </div>
          </form>
        )}
      </Card>
    </section>
  )
}


