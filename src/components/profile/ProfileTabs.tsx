"use client";

import { Button } from "@/components/ui/button";

type TabKey = "saved" | "activity" | "info";

interface ProfileTabsProps {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
}

const tabs: { key: TabKey; label: string }[] = [
  { key: "saved", label: "Saved Events" },
  { key: "activity", label: "My Activity" },
  { key: "info", label: "My Info" },
];

export const ProfileTabs = ({ activeTab, onChange }: ProfileTabsProps) => {
  return (
    <div className="inline-flex w-full gap-2">
      {tabs.map((tab) => (
        <Button
          key={tab.key}
          type="button"
          variant={activeTab === tab.key ? "primary" : "outline"}
          size="md"
          className="flex-1"
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  );
};
