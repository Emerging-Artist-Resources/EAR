"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { H3, H4, Text } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost } from "@/lib/fetch-utils";
import type { MyListing } from "@/features/profile/server/types";
import { AdminPagination } from "@/components/admin/AdminPagination";
import PerformanceModal from "@/components/performance-modal";

function listingBadgeVariant(listing: MyListing): "success" | "warning" | "error" | "default" {
  if (listing.status === "approved") return "success";
  if (listing.status === "pending" || listing.status === "pending_payment") return "warning";
  if (listing.status === "rejected") return "error";
  return "default";
}

function listingBadgeLabel(listing: MyListing): string {
  if (listing.status === "approved") return "Approved";
  if (listing.status === "pending_payment") return "Pending Payment";
  if (listing.status === "rejected") return "Rejected";
  if (listing.status === "pending") {
    if (listing.resubmitted_at) return "Resubmitted for Review";
    return "Pending Review";
  }
  return listing.status;
}

import { getCalendarListingTypeLabel } from "@/lib/listing-type-labels";

function getTypeLabel(type: string): string {
  return getCalendarListingTypeLabel(type);
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
  const [modalListingId, setModalListingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadingId, setLoadingId] = useState<string | null>(null);

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
  }, [page, refreshKey]);

  const openCreateModal = useCallback(() => {
    setModalListingId(null);
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((listingId: string) => {
    setModalListingId(listingId);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setModalListingId(null);
  }, []);

  const handleModalSuccess = useCallback(() => {
    closeModal();
    setPage(0);
    setRefreshKey((k) => k + 1);
  }, [closeModal]);

  const handlePayNow = useCallback(async (listingId: string) => {
    if (loadingId === listingId) return;
    
    try {
      setLoadingId(listingId);
      setError(null);
      const response = await apiPost<{ url: string }>("/api/stripe/create-checkout-session", {
        listingId,
      });
      
      if (response?.url) {
        window.location.href = response.url;
      } else {
        setError("Failed to create payment session");
        setLoadingId(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create payment session";
      setError(errorMessage);
      setLoadingId(null);
    }
  }, [loadingId]);

  const shouldShowPayButton = useCallback((listing: MyListing): boolean => {
    if (listing.status === "pending_payment") return true;
    if (listing.payment_status === "requires_payment") return true;
    if (listing.payment_status === "paid" || listing.payment_status === "not_required") return false;
    return false;
  }, []);

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <H3>My Listings</H3>
        <Button variant="link" onClick={openCreateModal} className="text-ear-baby-blue hover:text-ear-baby-blue/80">
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

              const showPayButton = shouldShowPayButton(listing);
              const isProcessing = loadingId === listing.id;

              return (
                <Card key={listing.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="pr-4 flex-1">
                      <H4>{getTypeLabel(listing.type)}</H4>
                      <Text className="text-sm text-gray-600">
                        Submitted on {formattedDate}
                      </Text>
                      <div className="mt-1 flex gap-2 flex-wrap items-center">
                        <Button 
                          variant="link" 
                          onClick={() => onListingClick?.(listing.id)}
                        >
                          View listing
                        </Button>
                        <Button
                          variant="link"
                          onClick={() => openEditModal(listing.id)}
                          className="text-ear-baby-blue hover:text-ear-baby-blue/80"
                        >
                          Edit
                        </Button>
                        {listing.status === "approved" && (
                          <Text className="text-xs text-gray-500 w-full sm:w-auto">
                            Editing will require re-approval
                          </Text>
                        )}
                        {showPayButton && (
                          <Button
                            variant="primary"
                            onClick={() => handlePayNow(listing.id)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? "Loading..." : "Pay Now"}
                          </Button>
                        )}
                      </div>
                    </div>
                    <Badge variant={listingBadgeVariant(listing)}>
                      {listingBadgeLabel(listing)}
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
        onClose={closeModal}
        onSuccess={handleModalSuccess}
        listingId={modalListingId}
      />
    </>
  );
};
