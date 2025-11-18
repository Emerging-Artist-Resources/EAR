import React, { useState } from "react"
import { Card } from "@/components/ui/card"
import { H2, H3, Text } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

export const ProfileSettings: React.FC = () => {
  const [earNewsletter, setEarNewsletter] = useState(true)
  const [artistNewsletter, setArtistNewsletter] = useState(true)

  return (
    <div className="space-y-8">
      <section>
        <H3 className="mb-3">Notification Preference</H3>
        <Card border="dashed" padding="md" className="space-y-4">
          <div className="rounded-md bg-gray-50 border border-gray-200 p-4 flex items-start justify-between">
            <div>
              <Text className="font-semibold">EAR Newsletter</Text>
              <Text className="text-sm text-gray-600">Receive monthly updates on EAR</Text>
            </div>
            <Checkbox checked={earNewsletter} onChange={(e) => setEarNewsletter((e.target as HTMLInputElement).checked)} />
          </div>
          <div className="rounded-md bg-gray-50 border border-gray-200 p-4 flex items-start justify-between">
            <div>
              <Text className="font-semibold">Artist Calendar Newsletter</Text>
              <Text className="text-sm text-gray-600">Weekly summaries of new opportunities and deadlines</Text>
            </div>
            <Checkbox checked={artistNewsletter} onChange={(e) => setArtistNewsletter((e.target as HTMLInputElement).checked)} />
          </div>
          <div className="pt-2">
            <Button>Save Preferences</Button>
          </div>
        </Card>
      </section>

      <section>
        <H3 className="mb-3">Account Settings</H3>
        <Card border="dashed" padding="md" className="space-y-6">
          <div>
            <Text className="font-semibold">Security</Text>
            <div className="mt-2">
              <Button className="w-full bg-accent-500 hover:bg-accent-600">Change Password</Button>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <Text className="font-semibold text-error-500">Danger Zone</Text>
            <div className="mt-3 rounded-md bg-error-50 border border-red-200 p-4">
              <Text className="font-semibold text-error-700">Delete Account</Text>
              <Text className="text-sm text-error-600">
                Permanently delete your account and all associated data. This action cannot be undone.
              </Text>
              <div className="mt-3">
                <Button className="bg-error-600 hover:bg-error-700">Delete My Account</Button>
              </div>
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
}


