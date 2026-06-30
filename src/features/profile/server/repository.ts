import {
  SavedEvent,
  ProfileSavedEventsFilter,
  SavedListing,
  ActivityOverview,
  ServiceInquirySummary,
  FiscalSponsorshipDashboard,
  DonationSummaryStats,
  ReceivedDonationSummary,
} from "./types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getPublicAppUrl } from "@/lib/config/app-url";
import { getListingTitle } from "@/features/events/server/listing-utils";
import type { PublicListingDetail } from "@/components/calendar/PublicListingDetailSections";
import type { FiscalSponsorshipStatus } from "@/lib/types/fiscal-sponsorship";
import { donationPageImagePublicUrl } from "@/lib/storage/donationPagePhotos";
import {
  type DonationDesignationConfigParsed,
  parseActiveDonationDesignationConfig,
} from "@/lib/donations/donationDesignationConfig";
import { mapDonationPageSettingsFromRow } from "@/lib/donations/donationPageSettings";
import type { DonationPageSettings } from "@/lib/donations/donationPageSettings";
import { parseDonationPresetAmounts } from "@/lib/donations/donationPresetAmounts";
import { resolveDonationRecipientDisplayName } from "@/lib/profile/donationRecipientDisplayName";
import { formatOccurrenceRangeEST } from "@/lib/datetime/utils";

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

    const primaryStartsAt =
      earliestOccurrence?.starts_at_utc ?? earliestDeadline?.starts_at_utc;
    if (!primaryStartsAt) continue;

    const isUpcoming = new Date(primaryStartsAt) >= new Date(now);
    const isPast = new Date(primaryStartsAt) < new Date(now);

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

    const location =
      earliestOccurrence?.venue_name ||
      earliestOccurrence?.address ||
      listing.venue_name ||
      listing.address ||
      earliestDeadline?.venue_name ||
      earliestDeadline?.address ||
      "Location TBD";

    const primaryEndsAt = earliestOccurrence?.starts_at_utc
      ? (earliestOccurrence.ends_at_utc ?? null)
      : (earliestDeadline?.ends_at_utc ?? null)

    const date = formatOccurrenceRangeEST(primaryStartsAt, primaryEndsAt)

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

    const isPrimaryFromEvent = !!earliestOccurrence?.starts_at_utc;
    const deadline =
      isPrimaryFromEvent && earliestDeadline
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
      primaryStartsAtIso: primaryStartsAt,
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
  fiscal_sponsorship_status: FiscalSponsorshipStatus;
  fiscal_sponsorship_approved_at: string | null;
  fiscal_sponsorship_approved_by: string | null;
  fiscal_sponsorship_note: string | null;
  donation_page_message: string | null;
  donation_page_image_path: string | null;
  donation_designation_config: unknown | null;
  donation_preset_amounts: unknown | null;
}

export interface PublicDonationProfile {
  id: string;
  name: string | null;
  slug: string;
  fiscal_sponsorship_status: FiscalSponsorshipStatus;
  donation_page_message: string | null;
  /** Resolved public URL; null when no path or path-only in DB. */
  donation_page_image_url: string | null;
  /** Parsed active config for designation dropdown; null when feature off. */
  donation_designation: DonationDesignationConfigParsed | null;
  /** Validated preset button amounts in USD; null = use app default on donate page. */
  donation_preset_amounts: number[] | null;
  /**
   * Name to show on donation pages (e.g. "Support …").
   * For company/festival, prefers organization_name when set; otherwise profile name.
   */
  donation_recipient_display_name: string | null;
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
    .select(
      "id, name, email, pronouns, website, organization_name, location_place_id, location_label, artist_status, slug, fiscal_sponsorship_status, fiscal_sponsorship_approved_at, fiscal_sponsorship_approved_by, fiscal_sponsorship_note, donation_page_message, donation_page_image_path, donation_designation_config, donation_preset_amounts",
    )
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
    .select(
      "id, name, slug, fiscal_sponsorship_status, donation_page_message, donation_page_image_path, donation_designation_config, donation_preset_amounts, profile_type, organization_name",
    )
    .eq("slug", slug)
    .eq("fiscal_sponsorship_status", "approved")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.slug) {
    return null;
  }

  const donation_page_image_url = data.donation_page_image_path
    ? await donationPageImagePublicUrl(data.donation_page_image_path)
    : null;

  const row = data as {
    id: string;
    name: string | null;
    slug: string;
    fiscal_sponsorship_status: string;
    donation_page_message: string | null;
    donation_page_image_path: string | null;
    donation_designation_config?: unknown;
    donation_preset_amounts?: unknown;
    profile_type: string | null;
    organization_name: string | null;
  };

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    fiscal_sponsorship_status: row.fiscal_sponsorship_status as FiscalSponsorshipStatus,
    donation_page_message: row.donation_page_message ?? null,
    donation_page_image_url,
    donation_designation: parseActiveDonationDesignationConfig(row.donation_designation_config),
    donation_preset_amounts: parseDonationPresetAmounts(row.donation_preset_amounts),
    donation_recipient_display_name: resolveDonationRecipientDisplayName({
      name: row.name,
      organization_name: row.organization_name,
      profile_type: row.profile_type,
    }),
  };
}

/**
 * Success-page lookup: do not gate on current fiscal eligibility.
 * We only need the slug/profile to render confirmation and to run mismatch checks.
 */
export async function getProfileBySlugForDonationSuccessRepo(
  slug: string,
): Promise<PublicDonationProfile | null> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, slug, fiscal_sponsorship_status, profile_type, organization_name")
    .eq("slug", slug)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data?.slug) {
    return null
  }

  const row = data as {
    id: string
    name: string | null
    slug: string
    fiscal_sponsorship_status: string
    profile_type: string | null
    organization_name: string | null
  }

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    fiscal_sponsorship_status: row.fiscal_sponsorship_status as FiscalSponsorshipStatus,
    donation_page_message: null,
    donation_page_image_url: null,
    donation_designation: null,
    donation_preset_amounts: null,
    donation_recipient_display_name: resolveDonationRecipientDisplayName({
      name: row.name,
      organization_name: row.organization_name,
      profile_type: row.profile_type,
    }),
  }
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
    .select(
      "id, name, email, pronouns, website, organization_name, location_place_id, location_label, artist_status, slug, fiscal_sponsorship_status, fiscal_sponsorship_approved_at, fiscal_sponsorship_approved_by, fiscal_sponsorship_note, donation_page_message, donation_page_image_path, donation_designation_config, donation_preset_amounts",
    )
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Profile not found");
  }

  return data;
}

export interface UpdateDonationPagePayload {
  donation_page_message: string | null;
  donation_preset_amounts: number[];
  donation_designation_config: unknown | null;
}

export async function updateDonationPageRepo(
  userId: string,
  payload: UpdateDonationPagePayload,
): Promise<DonationPageSettings> {
  const supabase = await getSupabaseServerClient();

  const updateData: Record<string, unknown> = {
    donation_page_message: payload.donation_page_message,
    donation_preset_amounts: payload.donation_preset_amounts,
    donation_designation_config: payload.donation_designation_config,
  };

  const { data, error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", userId)
    .select("donation_page_message, donation_designation_config, donation_preset_amounts")
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Profile not found");
  }

  return mapDonationPageSettingsFromRow({
    donation_page_message: data.donation_page_message as string | null,
    donation_designation_config: data.donation_designation_config,
    donation_preset_amounts: data.donation_preset_amounts,
  });
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

export async function fetchServiceInquiriesForUser(userId: string): Promise<ServiceInquirySummary[]> {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("service_inquiries")
    .select(
      `
      id,
      created_at,
      status,
      service_slug,
      services ( title )
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchServiceInquiriesForUser", error);
    throw error;
  }

  if (!data?.length) return [];

  return data.map((row) => {
    const svc = row.services
    const title =
      Array.isArray(svc) && svc[0]?.title != null
        ? String(svc[0].title)
        : !Array.isArray(svc) && svc && typeof svc === "object" && "title" in svc
          ? String((svc as { title: string }).title)
          : null
    return {
      id: row.id as string,
      created_at: row.created_at as string,
      status: row.status as string,
      service_slug: row.service_slug as string,
      service_title: title,
    }
  })
}

export const FISCAL_SPONSORSHIP_DONATIONS_PAGE_SIZE = 10;

type ReceivedDonationDbRow = {
  id: unknown;
  created_at: unknown;
  donor_name: unknown;
  donor_email: unknown;
  amount: unknown;
  message: unknown;
  designation_label_snapshot: unknown;
};

export function mapReceivedDonationSummary(row: ReceivedDonationDbRow): ReceivedDonationSummary {
  return {
    id: row.id as string,
    created_at: row.created_at as string,
    donor_name: (row.donor_name as string | null) ?? null,
    donor_email: (row.donor_email as string | null) ?? null,
    amount: row.amount as number,
    message: (row.message as string | null) ?? null,
    designation_label_snapshot: (row.designation_label_snapshot as string | null) ?? null,
  };
}

export function computeDonationSummaryStats(amounts: number[]): DonationSummaryStats {
  const donation_count = amounts.length;
  const total_amount_cents = amounts.reduce((sum, amount) => sum + amount, 0);
  const average_amount_cents =
    donation_count > 0 ? Math.round(total_amount_cents / donation_count) : 0;

  return {
    total_amount_cents,
    donation_count,
    average_amount_cents,
  };
}

export async function fetchFiscalSponsorshipDashboardRepo(
  userId: string,
  options: { page: number; limit: number },
): Promise<FiscalSponsorshipDashboard> {
  const profile = await getProfileRepo(userId);
  if (!profile) {
    throw new Error("Profile not found");
  }

  const { page, limit } = options;
  const from = page * limit;
  const to = from + limit - 1;

  const supabase = await getSupabaseServerClient();

  const donationsQuery = supabase
    .from("donations")
    .select(
      "id, created_at, donor_name, donor_email, amount, message, designation_label_snapshot",
      { count: "exact" },
    )
    .eq("recipient_user_id", userId)
    .eq("payment_status", "paid")
    .order("created_at", { ascending: false })
    .range(from, to);

  const summaryAmountsQuery = supabase
    .from("donations")
    .select("amount")
    .eq("recipient_user_id", userId)
    .eq("payment_status", "paid");

  const [{ data, error, count }, { data: amountRows, error: summaryError }] = await Promise.all([
    donationsQuery,
    summaryAmountsQuery,
  ]);

  if (error) {
    throw error;
  }

  if (summaryError) {
    throw summaryError;
  }

  const slug = profile.slug?.trim() || null;
  const donation_link = slug
    ? `${getPublicAppUrl()}/donate/${encodeURIComponent(slug)}`
    : null;

  const donations: ReceivedDonationSummary[] = (data ?? []).map(mapReceivedDonationSummary);
  const donations_summary = computeDonationSummaryStats(
    (amountRows ?? []).map((row) => row.amount as number),
  );

  const donation_page = mapDonationPageSettingsFromRow({
    donation_page_message: profile.donation_page_message,
    donation_designation_config: profile.donation_designation_config,
    donation_preset_amounts: profile.donation_preset_amounts,
  });

  return {
    fiscal_sponsorship_status: profile.fiscal_sponsorship_status,
    fiscal_sponsorship_approved_at: profile.fiscal_sponsorship_approved_at,
    fiscal_sponsorship_note: profile.fiscal_sponsorship_note,
    slug,
    donation_link,
    donation_page,
    donations_summary,
    donations,
    donations_total_count: count ?? 0,
    page,
    limit,
  };
}
