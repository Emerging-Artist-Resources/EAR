import { SavedEvent, ProfileSavedEventsFilter } from "./types";

// This will eventually talk to your DB / API.
// For now it's just a stub.

export async function fetchSavedEventsFromDb(
  _userId: string,
  _filter: ProfileSavedEventsFilter
): Promise<SavedEvent[]> {
  // TODO: replace mock data with real DB calls.

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
