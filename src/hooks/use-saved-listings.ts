"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiGet, apiPost, apiDelete } from "@/lib/client/fetch-utils";

export function useSavedListings(listingId?: string, initialIsSaved?: boolean) {
  const { isAuthed } = useAuth();
  const [isSaved, setIsSaved] = useState(initialIsSaved ?? false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSaved = useCallback(async () => {
    if (!listingId || !isAuthed) {
      setIsSaved(false);
      return;
    }
    
    let isMounted = true;
    try {
      setLoading(true);
      setError(null);
      const saved = await apiGet<boolean>(`/api/profile/saved-listings?listingId=${listingId}`);
      if (isMounted) {
        setIsSaved(saved);
      }
    } catch (err) {
      if (isMounted) {
        setError(err instanceof Error ? err.message : "Failed to check saved status");
        setIsSaved(false);
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  }, [listingId, isAuthed]);

  // Auto-check on mount if listingId provided and we don't have initial value
  // If we have initialIsSaved, skip the initial fetch to avoid loading state
  useEffect(() => {
    if (listingId && isAuthed && initialIsSaved === undefined) {
      void checkSaved();
    }
    return () => {
      // Cleanup handled by isMounted flag in checkSaved
    };
  }, [listingId, isAuthed, initialIsSaved, checkSaved]);

  const toggleSave = useCallback(async () => {
    if (!listingId || !isAuthed || saving) return; // Prevent concurrent toggles
    
    const previousState = isSaved;
    setIsSaved(!previousState); // Optimistic update
    setSaving(true);
    setError(null);
    
    let isMounted = true;
    try {
      if (previousState) {
        await apiDelete(`/api/profile/saved-listings/${listingId}`);
      } else {
        await apiPost("/api/profile/saved-listings", { listingId });
      }
      // Don't update state here - optimistic update already done
    } catch (err) {
      if (isMounted) {
        setIsSaved(previousState); // Rollback on error
        setError(err instanceof Error ? err.message : "Failed to save listing");
      }
    } finally {
      if (isMounted) {
        setSaving(false);
      }
    }
  }, [listingId, isAuthed, isSaved, saving]);

  return { isSaved, loading, saving, error, toggleSave, checkSaved };
}
