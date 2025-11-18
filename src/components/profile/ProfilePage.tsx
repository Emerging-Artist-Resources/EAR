"use client";

import { useState } from "react";
import { ProfileLayout } from "./ProfileLayout";
import { ProfileTabs } from "./ProfileTabs";
import { SavedEventsTab } from "./saved-events/SavedEventsTab";
import { ActivityTab } from "./activity/ActivityTab";
import { MyInfoTab } from "./info/MyInfoTab";
import { ProfileSettings } from "./settings/ProfileSettings";

type ProfileTabKey = "saved" | "activity" | "info";

export const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState<ProfileTabKey>("saved");
  const [showSettings, setShowSettings] = useState(false);

  return (
    <ProfileLayout onOpenSettings={() => setShowSettings(true)}>
      {!showSettings && <ProfileTabs activeTab={activeTab} onChange={setActiveTab} />}

      {showSettings ? (
        <div className="mt-6">
          <ProfileSettings />
          <div className="mt-4">
            <button
              type="button"
              className="text-primary underline text-sm" 
              onClick={() => setShowSettings(false)}
            >
              ← Back to profile
            </button>
          </div>
        </div>
      ) : (
        <>
          {activeTab === "saved" && <SavedEventsTab />}
          {activeTab === "activity" && <ActivityTab />}
          {activeTab === "info" && <MyInfoTab />}
        </>
      )}
    </ProfileLayout>
  );
};
