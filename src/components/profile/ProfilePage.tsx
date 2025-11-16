"use client";

import { useState } from "react";
import { ProfileLayout } from "./ProfileLayout";
import { ProfileTabs } from "./ProfileTabs";
import { SavedEventsTab } from "./saved-events/SavedEventsTab";
import { Text } from "@/components/ui/typography";

type ProfileTabKey = "saved" | "activity" | "info";

export const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState<ProfileTabKey>("saved");

  return (
    <ProfileLayout>
      <ProfileTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "saved" && <SavedEventsTab />}
      {activeTab === "activity" && (
        <div className="mt-6">
          <Text className="text-sm text-gray-600">My Activity tab coming soon.</Text>
        </div>
      )}
      {activeTab === "info" && (
        <div className="mt-6">
          <Text className="text-sm text-gray-600">My Info tab coming soon.</Text>
        </div>
      )}
    </ProfileLayout>
  );
};
