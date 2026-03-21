import { SavedEvent, ProfileSavedEventsFilter, SavedListing, ActivityOverview } from "./types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getListingTitle } from "@/features/events/server/listing-utils";
import type { PublicListingDetail } from "@/components/calendar/PublicListingDetailSections";

export async function fetchSavedEventsFromDb(
  userId: string,
  filter: ProfileSavedEventsFilter
): Promise<SavedEvent[]> {
  const supabase = await getSupabaseServerClient();
  const now = new Date().toISOString();

  // Build query to get saved listings with listing details
  let query = supabase
    .from("saved_listings")
    .select(`
      id,
      listing_id,
      attendance_status,
      saved_at,
      listings!saved_listings_listing_id_fkey (
        id,
        type,
        status,
        address,
        venue_name,
        performance_details (*),
        audition_details (*),
        creative_details (*),
        class_workshop_details!class_workshop_details_listing_id_fkey (*),
        piece_details!piece_details_listing_id_fkey (*),
        listing_occurrences!listing_occurrences_listing_id_fkey (
          id,
          occurrence_type,
          starts_at_utc,
          ends_at_utc,
          tz,
          address,
          venue_name
        )
      )
    `)
    .eq("user_id", userId)
    .eq("listings.status", "approved")
    .is("listings.deleted_at", null)
    .order("saved_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching saved events:", error);
    throw error;
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Transform the data to SavedEvent format
  const events: SavedEvent[] = [];

  for (const savedListing of data) {
    const listing = savedListing.listings as any;
    if (!listing) continue;

    // Get the earliest occurrence for date/location
    const occurrences = listing.listing_occurrences || [];
    const eventOccurrences = occurrences.filter((occ: any) => 
      occ.occurrence_type === "event" || !occ.occurrence_type // Handle null/undefined as event
    );
    const deadlineOccurrences = occurrences.filter((occ: any) => occ.occurrence_type === "deadline");

    // Sort occurrences by start time
    eventOccurrences.sort((a: any, b: any) => 
      new Date(a.starts_at_utc).getTime() - new Date(b.starts_at_utc).getTime()
    );

    const earliestOccurrence = eventOccurrences[0];
    const earliestDeadline = deadlineOccurrences.length > 0
      ? deadlineOccurrences.sort((a: any, b: any) => 
          new Date(a.starts_at_utc).getTime() - new Date(b.starts_at_utc).getTime()
        )[0]
      : null;

    // Determine if event is upcoming or past based on earliest occurrence
    const eventDate = earliestOccurrence?.starts_at_utc;
    if (!eventDate) continue;

    const isUpcoming = new Date(eventDate) >= new Date(now);
    const isPast = new Date(eventDate) < new Date(now);

    // Apply filter
    if (filter.mode === "upcoming" && !isUpcoming) continue;
    if (filter.mode === "past" && !isPast) continue;

    // Get listing title using the utility function
    const listingDetail: PublicListingDetail = {
      id: listing.id,
      type: listing.type,
      address: listing.address,
      venue_name: listing.venue_name,
      performance_details: listing.performance_details,
      audition_details: listing.audition_details,
      creative_details: listing.creative_details,
      class_workshop_details: listing.class_workshop_details,
      piece_details: listing.piece_details,
      listing_occurrences: occurrences,
    };

    const title = getListingTitle(listingDetail);

    // Get location from occurrence or listing
    const location = earliestOccurrence?.venue_name || 
                    earliestOccurrence?.address || 
                    listing.venue_name || 
                    listing.address || 
                    "Location TBD";

    // Format date
    const date = new Date(eventDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Get description from appropriate detail table
    let description: string | undefined;
    if (listing.type === "performance" && listing.performance_details) {
      description = listing.performance_details.short_description || undefined;
    } else if (listing.type === "audition" && listing.audition_details) {
      description = listing.audition_details.about_project || undefined;
    } else if (listing.type === "creative" && listing.creative_details) {
      description = listing.creative_details.brief_description || undefined;
    } else if (listing.type === "class" && listing.class_workshop_details) {
      description = listing.class_workshop_details.description || undefined;
    }

    // Format deadline if exists
    const deadline = earliestDeadline
      ? new Date(earliestDeadline.starts_at_utc).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : undefined;

    events.push({
      id: listing.id,
      type: listing.type as SavedEvent["type"],
      name: title,
      date,
      location,
      deadline,
      description,
      isSaved: true,
      attendanceStatus: savedListing.attendance_status as "attended" | "missed" | null,
    });
  }

  return events;
}

export async function saveListingRepo(userId: string, listingId: string): Promise<SavedListing> {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("saved_listings")
    .insert({
      user_id: userId,
      listing_id: listingId,
    })
    .select()
    .single();

  if (error) {
    // If it's a unique constraint violation, the listing is already saved
    if (error.code === "23505") {
      // Fetch the existing record
      const { data: existing, error: fetchError } = await supabase
        .from("saved_listings")
        .select()
        .eq("user_id", userId)
        .eq("listing_id", listingId)
        .single();

      if (fetchError) throw fetchError;
      if (!existing) throw new Error("Failed to save listing");
      return existing;
    }
    throw error;
  }

  if (!data) {
    throw new Error("Failed to save listing");
  }

  return data;
}

export async function unsaveListingRepo(userId: string, listingId: string): Promise<void> {
  const supabase = await getSupabaseServerClient();

  const { error } = await supabase
    .from("saved_listings")
    .delete()
    .eq("user_id", userId)
    .eq("listing_id", listingId);

  if (error) {
    throw error;
  }
}

export async function updateAttendanceStatusRepo(
  userId: string,
  listingId: string,
  status: "attended" | "missed" | null
): Promise<SavedListing> {
  const supabase = await getSupabaseServerClient();

  // First check if the saved_listing exists
  const { data: existing, error: checkError } = await supabase
    .from("saved_listings")
    .select()
    .eq("user_id", userId)
    .eq("listing_id", listingId)
    .single();

  if (checkError && checkError.code !== "PGRST116") {
    throw checkError;
  }

  if (!existing) {
    // If it doesn't exist, create it with the attendance status
    const { data, error } = await supabase
      .from("saved_listings")
      .insert({
        user_id: userId,
        listing_id: listingId,
        attendance_status: status,
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error("Failed to update attendance status");
    return data;
  }

  // Update existing record
  const { data, error } = await supabase
    .from("saved_listings")
    .update({
      attendance_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("listing_id", listingId)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to update attendance status");

  return data;
}

export async function checkListingSavedRepo(userId: string, listingId: string): Promise<boolean> {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("saved_listings")
    .select("id")
    .eq("user_id", userId)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return !!data;
}

export async function getActivityOverviewRepo(userId: string): Promise<ActivityOverview> {
  const supabase = await getSupabaseServerClient();

  // Get saved events count
  const { count: savedCount } = await supabase
    .from("saved_listings")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  // Get listings submitted count
  const { count: listingsCount } = await supabase
    .from("listings")
    .select("*", { count: "exact", head: true })
    .eq("created_by", userId)
    .is("deleted_at", null);

  // Get attended events count (saved listings with attendance_status = 'attended')
  const { count: attendedCount } = await supabase
    .from("saved_listings")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("attendance_status", "attended");

  return {
    savedCount: savedCount || 0,
    listingsCount: listingsCount || 0,
    attendedCount: attendedCount || 0,
  };
}

export interface ProfileData {
  id: string;
  name: string | null;
  email: string | null;
  pronouns: string | null;
  website: string | null;
  organization_name: string | null;
  location_place_id: string | null;
  location_label: string | null;
  artist_status: string | null;
  slug: string | null;
}

export interface PublicDonationProfile {
  id: string;
  name: string | null;
  slug: string;
}

export interface EligibilitySubmission {
  id: string;
  profile_id: string;
  suggested_status: string | null;
  decision: string | null;
  final_status: string | null;
  reviewed_at: string | null;
  created_at: string;
  version: number;
}

export async function getProfileRepo(userId: string): Promise<ProfileData | null> {
  const supabase = await getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, pronouns, website, organization_name, location_place_id, location_label, artist_status, slug")
    .eq("id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return data;
}

export async function getProfileBySlugForDonationRepo(slug: string): Promise<PublicDonationProfile | null> {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.slug) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
  };
}

export async function updateProfileRepo(
  userId: string,
  updates: Partial<ProfileData>
): Promise<ProfileData> {
  const supabase = await getSupabaseServerClient();
  
  const updateData: Record<string, unknown> = {};
  
  if (updates.name !== undefined) updateData.name = updates.name || null;
  if (updates.email !== undefined) updateData.email = updates.email || null;
  if (updates.pronouns !== undefined) updateData.pronouns = updates.pronouns || null;
  if (updates.website !== undefined) updateData.website = updates.website || null;
  if (updates.organization_name !== undefined) updateData.organization_name = updates.organization_name || null;
  if (updates.location_place_id !== undefined) updateData.location_place_id = updates.location_place_id && typeof updates.location_place_id === "string" && updates.location_place_id.trim() !== "" ? updates.location_place_id.trim() : null;
  if (updates.location_label !== undefined) updateData.location_label = updates.location_label || null;
  if (updates.slug !== undefined) updateData.slug = updates.slug || null;

  const { data, error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", userId)
    .select("id, name, email, pronouns, website, organization_name, location_place_id, location_label, artist_status, slug")
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Profile not found");
  }

  return data;
}

export async function getEligibilitySubmissionsRepo(userId: string): Promise<EligibilitySubmission[]> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data, error } = await supabase
      .from("emerging_eligibility_submissions")
      .select("*")
      .eq("profile_id", userId)
      .order("id", { ascending: false });

    if (error) {
      console.error("Database error fetching eligibility submissions:", {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        userId,
      });
      throw error;
    }

    if (!data) return [];

    return data.map((submission: any) => {
      const createdAt = submission.created_at || submission.createdAt || submission.submitted_at || null;
      
      return {
        id: submission.id,
        profile_id: submission.profile_id,
        suggested_status: submission.suggested_status,
        decision: submission.decision,
        final_status: submission.final_status,
        reviewed_at: submission.reviewed_at,
        created_at: createdAt || new Date().toISOString(),
        version: submission.version || 1,
      };
    });
  } catch (err) {
    console.error("Error in getEligibilitySubmissionsRepo:", err);
    throw err;
  }
}
