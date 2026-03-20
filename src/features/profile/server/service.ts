import { 
  fetchSavedEventsFromDb, 
  saveListingRepo, 
  unsaveListingRepo, 
  updateAttendanceStatusRepo,
  checkListingSavedRepo,
  getActivityOverviewRepo
} from "./repository";
import { ProfileSavedEventsFilter, SavedEvent, SavedListing, ActivityOverview } from "./types";
import { sendProfileEmail } from "@/lib/email/sendProfileEmail";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export async function getSavedEvents(
  userId: string,
  filter: ProfileSavedEventsFilter
): Promise<SavedEvent[]> {
  const events = await fetchSavedEventsFromDb(userId, filter);
  return events;
}

export async function saveListing(userId: string, listingId: string): Promise<SavedListing> {
  return await saveListingRepo(userId, listingId);
}

export async function unsaveListing(userId: string, listingId: string): Promise<void> {
  return await unsaveListingRepo(userId, listingId);
}

export async function updateAttendanceStatus(
  userId: string,
  listingId: string,
  status: "attended" | "missed" | null
): Promise<SavedListing> {
  return await updateAttendanceStatusRepo(userId, listingId, status);
}

export async function checkListingSaved(userId: string, listingId: string): Promise<boolean> {
  return await checkListingSavedRepo(userId, listingId);
}

export async function getActivityOverview(userId: string): Promise<ActivityOverview> {
  return await getActivityOverviewRepo(userId);
}

function extractFirstName(fullName: string | null | undefined): string {
  if (!fullName) return "there"
  const parts = fullName.trim().split(/\s+/)
  return parts[0] || "there"
}

export async function sendNewProfileAdminEmail(
  profile: { name: string | null; email: string | null; profile_type: string | null },
  userId: string
): Promise<void> {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL
  if (!adminEmail) {
    console.warn("[EMAIL] ADMIN_NOTIFICATION_EMAIL not set, skipping admin notification")
    return
  }

  // Ensure name is properly extracted - handle null, undefined, and empty strings
  const userName = profile.name?.trim() || "Unknown User"
  const userEmail = profile.email?.trim() || "No email provided"
  const profileType = profile.profile_type || "unknown"

  await sendProfileEmail("admin-new-user", {
    to: adminEmail,
    userName,
    userEmail,
    profileType,
    userId,
  })
}

export async function sendProfileApprovalEmail(
  userName: string | null,
  userEmail: string | null,
  userId: string
): Promise<void> {
  if (!userEmail) {
    console.warn("[EMAIL] User email not available, skipping profile approval email")
    return
  }

  const firstName = extractFirstName(userName)

  await sendProfileEmail("profile-approved", {
    to: userEmail,
    firstName,
    userName: userName || "there",
    userId,
  })
}

export async function sendEmailVerificationEmail(
  userEmail: string,
  userName: string | null
): Promise<void> {
  const supabase = getSupabaseServiceClient()
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.eararts.org"
  const redirectTo = `${baseUrl}/auth/callback`

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: userEmail,
    options: {
      redirectTo,
    },
  })

  if (error || !data?.properties?.action_link) {
    console.error("[EMAIL] Failed to generate email verification link:", error)
    throw new Error("Failed to generate email verification link")
  }

  const verificationUrl = data.properties.action_link
  const firstName = extractFirstName(userName)

  await sendProfileEmail("email-confirmation", {
    to: userEmail,
    firstName,
    verificationUrl,
  })
}
