"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { H3, H4, Text } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { apiGet } from "@/lib/fetch-utils";
import type { MyListing } from "@/features/profile/server/types";
import { AdminPagination } from "@/components/admin/AdminPagination";
import PerformanceModal from "@/components/performance-modal";

function statusToVariant(status: MyListing["status"]): "success" | "warning" | "error" | "default" {
  if (status === "approved") return "success";
  if (status === "pending") return "warning";
  if (status === "rejected") return "error";
  return "default";
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    performance: "Performance",
    audition: "Audition",
    creative: "Creative Opportunity",
    class: "Class/Workshop",
  };
  return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

const LISTINGS_PER_PAGE = 5;

function ListingSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="pr-4 flex-1 space-y-2">
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mt-1" />
        </div>
        <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
      </div>
    </Card>
  );
}

function ListingsLoadingSkeleton() {
  return (
    <>
      {Array.from({ length: LISTINGS_PER_PAGE }).map((_, index) => (
        <ListingSkeleton key={index} />
      ))}
    </>
  );
}

interface MyListingsProps {
  onListingClick?: (listingId: string) => void;
}

export const MyListings = ({ onListingClick }: MyListingsProps) => {
  const [listings, setListings] = useState<MyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const loadListings = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiGet<{ listings: MyListing[], total: number }>(`/api/profile/my-listings?page=${page}&limit=${LISTINGS_PER_PAGE}`);
        
        if (isMounted) {
          setListings(data.listings);
          setTotal(data.total);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load listings");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadListings();

    return () => {
      isMounted = false;
    };
  }, [page]);

  const handleSubmitPerformance = () => {
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    // Refresh listings after successful submission
    setPage(0);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <H3>My Listings</H3>
        <Button variant="link" onClick={handleSubmitPerformance}>
          + Submit New Listing
        </Button>
      </div>
      <Card border="dashed" padding="md" className="space-y-3">
        {loading ? (
          <ListingsLoadingSkeleton />
        ) : error ? (
          <div className="text-center text-red-600">
            <Text className="text-sm">{error}</Text>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center text-gray-600">
            <Text className="text-sm">You haven't submitted any listings yet.</Text>
          </div>
        ) : (
          <>
            {listings.map((listing) => {
              const date = new Date(listing.submitted_at);
              const formattedDate = date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              });

              return (
                <Card key={listing.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="pr-4 flex-1">
                      <H4>{getTypeLabel(listing.type)}</H4>
                      <Text className="text-sm text-gray-600">
                        Submitted on {formattedDate}
                      </Text>
                      <div className="mt-1">
                        <Button 
                          variant="link" 
                          onClick={() => onListingClick?.(listing.id)}
                        >
                          View listing
                        </Button>
                      </div>
                    </div>
                    <Badge variant={statusToVariant(listing.status)}>
                      {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                    </Badge>
                  </div>
                </Card>
              );
            })}
            {total > LISTINGS_PER_PAGE && (
              <AdminPagination
                page={page}
                limit={LISTINGS_PER_PAGE}
                total={total}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </Card>
      <PerformanceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </>
  );
};
