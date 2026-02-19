import { 
  fetchSavedEventsFromDb, 
  saveListingRepo, 
  unsaveListingRepo, 
  updateAttendanceStatusRepo,
  checkListingSavedRepo,
  getActivityOverviewRepo
} from "./repository";
import { ProfileSavedEventsFilter, SavedEvent, SavedListing, ActivityOverview } from "./types";

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
