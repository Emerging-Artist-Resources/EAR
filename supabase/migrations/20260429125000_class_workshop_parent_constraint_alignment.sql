-- Align class_workshop_details parent constraint with current class submission flow.
-- Allows:
--   1) WORKSHOP rows without parent fields
--   2) CLASS rows linked to an existing parent listing
--   3) CLASS rows with manual placeholder parent details
--   4) standalone CLASS rows with no parent fields

ALTER TABLE class_workshop_details
  DROP CONSTRAINT IF EXISTS class_workshop_details_parent_check;

ALTER TABLE class_workshop_details
  ADD CONSTRAINT class_workshop_details_parent_check CHECK (
    (class_workshop_type = 'WORKSHOP') OR
    (parent_listing_id IS NOT NULL) OR
    (parent_workshop_name IS NOT NULL AND parent_workshop_contact_email IS NOT NULL) OR
    (parent_listing_id IS NULL AND parent_workshop_name IS NULL AND parent_workshop_contact_email IS NULL)
  );
