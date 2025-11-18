import { ReactNode } from "react";
import { H1, Text } from "@/components/ui/typography"; // adjust if name differs
import { Button } from "@/components/ui/button";
import { CiSettings } from "react-icons/ci";

interface ProfileLayoutProps {
  children: ReactNode;
  onOpenSettings?: () => void;
}

export const ProfileLayout = ({ children, onOpenSettings }: ProfileLayoutProps) => {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <H1 className="text-primary">My Profile</H1>
            <Text className="mt-1 text-sm">
              Manage your account information and preferences.
            </Text>
          </div>
          <Button
            variant="link"
            className="text-gray-600 hover:text-gray-800"
            aria-label="Profile settings"
            onClick={onOpenSettings}
          >
            <CiSettings className="w-7 h-7" />
          </Button>
        </div>
      </header>
      {children}
    </div>
  );
};
