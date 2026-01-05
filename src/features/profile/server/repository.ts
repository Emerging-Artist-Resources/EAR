import { SavedEvent, ProfileSavedEventsFilter } from "./types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function fetchSavedEventsFromDb(
  _userId: string,
  _filter: ProfileSavedEventsFilter
): Promise<SavedEvent[]> {
  // TODO: replace mock data with real DB calls when events table is ready.

  // Example mock data:
  const mockEvents: SavedEvent[] = [
    {
      id: "1",
      type: "performance",
      name: "Sample Performance",
      date: "2025-12-01",
      location: "NYC",
      description: "A sample show description.",
      isSaved: true,
      attendanceStatus: null,
    },
    {
      id: "2",
      type: "class",
      name: "Contemporary Class",
      date: "2025-11-20",
      location: "Brooklyn",
      description: "Class details here.",
      isSaved: true,
      attendanceStatus: "attended",
    },
  ];

  // Filter logic placeholder – update when you have real data
  return mockEvents;
}

export interface ProfileData {
  id: string;
  name: string | null;
  email: string | null;
  pronouns: string | null;
  website: string | null;
  organization_name: string | null;
  location_label: string | null;
  artist_status: string | null;
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
    .select("id, name, email, pronouns, website, organization_name, location_label, artist_status")
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
