import { ReactNode } from "react";
import { H1, Text } from "@/components/ui/typography"; // adjust if name differs

interface ProfileLayoutProps {
  children: ReactNode;
}

export const ProfileLayout = ({ children }: ProfileLayoutProps) => {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
      <H1 className="text-primary">My Profile</H1>
      <Text className="mt-1 text-sm">
        Manage your account information and preferences.
      </Text>
    </header>
    {children}
  </div>
);
};
