import { fetchSavedEventsFromDb } from "./repository";
import { ProfileSavedEventsFilter, SavedEvent } from "./types";

export async function getSavedEvents(
  userId: string,
  filter: ProfileSavedEventsFilter
): Promise<SavedEvent[]> {
  // You can add business rules here (sorting, extra filtering, etc.)
  const events = await fetchSavedEventsFromDb(userId, filter);
  return events;
}
