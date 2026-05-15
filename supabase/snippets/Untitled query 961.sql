-- Embedded organizer program (split bill / festival) pieces + per-piece image paths (JSONB).
ALTER TABLE performance_details
  ADD COLUMN IF NOT EXISTS organizer_program_pieces jsonb;

COMMENT ON COLUMN performance_details.organizer_program_pieces IS
  'Versioned JSON: { "version": 1, "pieces": [{ "id", text fields, "selected_slots", "photos", ... }] } for organizer multi-program submissions.';
