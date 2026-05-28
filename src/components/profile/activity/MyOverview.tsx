"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { H3, H4, Text } from "@/components/ui/typography";
import { useState, useEffect } from "react";
import { apiGet } from "@/lib/client/fetch-utils";
import type { ActivityOverview } from "@/features/profile/server/types";

export const MyOverview = () => {
  const [overview, setOverview] = useState<ActivityOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const loadOverview = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiGet<ActivityOverview>("/api/profile/activity-overview");
        
        if (isMounted) {
          setOverview(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load overview");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadOverview();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <>
        <H3 className="mb-3">Activity Overview</H3>
        <Card border="dashed" padding="md">
          <Text className="text-sm text-gray-600">Loading...</Text>
        </Card>
      </>
    );
  }

  if (error) {
    return (
      <>
        <H3 className="mb-3">Activity Overview</H3>
        <Card border="dashed" padding="md">
          <Text className="text-sm text-red-600">{error}</Text>
        </Card>
      </>
    );
  }

  if (!overview) {
    return null;
  }

  return (
    <>
      <H3 className="mb-3">Activity Overview</H3>
      <Card border="dashed" padding="md">
        <div className="space-y-3">
          <OverviewRow
            title="Events Saved"
            description="Events bookmarked for later"
            count={overview.savedCount}
            colorClass="bg-cyan-50"
          />
          <OverviewRow
            title="Listings Submitted"
            description="Listings you submitted for review"
            count={overview.listingsCount}
            colorClass="bg-green-50"
          />
          <OverviewRow
            title="Events Attended"
            description="Events you've participated in"
            count={overview.attendedCount}
            colorClass="bg-orange-50"
          />
        </div>
      </Card>
    </>
  );
}

function OverviewRow({
    title,
    description,
    count,
    colorClass,
  }: {
    title: string
    description: string
    count: number
    colorClass?: string
  }) {
    return (
      <div className={`flex items-center justify-between rounded-md px-4 py-3 ${colorClass ?? "bg-gray-50"}`}>
        <div>
          <H4>{title}</H4>
          <Text className="text-sm text-gray-600">{description}</Text>
        </div>
        <Badge variant="primary">{count}</Badge>
      </div>
    )
  }