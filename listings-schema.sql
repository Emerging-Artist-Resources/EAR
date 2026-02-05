-- ============================================================================
-- LISTINGS SCHEMA DESIGN
-- ============================================================================
-- This schema supports:
-- 1. Base listings table with common fields
-- 2. Type-specific detail tables (audition, creative, performance, class)
-- 3. Parent-child relationships:
--    - Performance (ORGANIZER) can have Pieces (PIECE) as children
--    - Workshop can have Classes as children
-- 4. Admin merge operations (tracking merged entities)
-- 5. Admin ability to add children to parents
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE listing_type AS ENUM (
  'audition',
  'creative',
  'performance',
  'class'
);

CREATE TYPE listing_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'draft'
);

CREATE TYPE performance_subtype AS ENUM (
  'ORGANIZER',
  'PIECE'
);

CREATE TYPE performance_event_type AS ENUM (
  'SOLO',
  'SPLIT_BILL',
  'FESTIVAL'
);

CREATE TYPE class_workshop_type AS ENUM (
  'CLASS',
  'WORKSHOP'
);

CREATE TYPE artist_type AS ENUM (
  'ESTABLISHED',
  'EMERGING'
);

CREATE TYPE listing_fee_option AS ENUM (
  'PAY_FEE',
  'PROVIDE',
  'EXPLAIN'
);

-- ============================================================================
-- MAIN LISTINGS TABLE
-- ============================================================================
-- Base table containing common fields for all listing types

CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Type and status
  type listing_type NOT NULL,
  status listing_status DEFAULT 'pending' NOT NULL,
  
  -- Contact information (from user profile)
  contact_name TEXT NOT NULL,
  pronouns TEXT,
  contact_email TEXT NOT NULL,
  
  -- Organization information
  company TEXT,
  company_website TEXT,
  
  -- Location information (default location for listing)
  address TEXT,
  place_id TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  venue_name TEXT,
  location_instructions TEXT,
  
  -- Media and social
  social_handles TEXT,
  notes TEXT,
  
  -- Metadata
  meta JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Soft delete
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_listings_type ON listings(type);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_created_by ON listings(created_by);
CREATE INDEX idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX idx_listings_deleted_at ON listings(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_listings_type_status_deleted ON listings(type, status, deleted_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- LISTING PHOTOS
-- ============================================================================

CREATE TABLE listing_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  credit TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT listing_photos_sort_order_check CHECK (sort_order >= 0 AND sort_order < 10)
);

CREATE INDEX idx_listing_photos_listing_id ON listing_photos(listing_id);
CREATE INDEX idx_listing_photos_listing_sort ON listing_photos(listing_id, sort_order);

-- ============================================================================
-- LISTING OCCURRENCES
-- ============================================================================
-- Stores date/time occurrences for listings
-- Each occurrence can have its own location (nullable, inherits from listing if not specified)
-- occurrence_type: 'event' for regular occurrences, 'deadline' for audition/creative deadlines

CREATE TYPE occurrence_type AS ENUM (
  'event',
  'deadline'
);

CREATE TABLE listing_occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  occurrence_type occurrence_type DEFAULT 'event' NOT NULL,
  starts_at_utc TIMESTAMPTZ NOT NULL,
  ends_at_utc TIMESTAMPTZ,
  tz TEXT NOT NULL,
  
  -- Location fields (nullable, can inherit from listing if not specified)
  address TEXT,
  place_id TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  venue_name TEXT,
  location_instructions TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_listing_occurrences_listing_id ON listing_occurrences(listing_id);
CREATE INDEX idx_listing_occurrences_starts_at ON listing_occurrences(starts_at_utc);
CREATE INDEX idx_listing_occurrences_listing_starts ON listing_occurrences(listing_id, starts_at_utc);
CREATE INDEX idx_listing_occurrences_type ON listing_occurrences(occurrence_type);

-- ============================================================================
-- AUDITION DETAILS
-- ============================================================================

CREATE TABLE audition_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL UNIQUE REFERENCES listings(id) ON DELETE CASCADE,
  
  -- Core fields
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  eligibility TEXT NOT NULL,
  compensation TEXT NOT NULL,
  instructions TEXT NOT NULL,
  pre_audition_classes TEXT,
  
  -- Fee information
  -- Note: fee can be NULL (for NO_FEE), or one of PAY_FEE, PROVIDE, EXPLAIN
  fee listing_fee_option,
  fee_amount TEXT,
  artist_type artist_type NOT NULL, -- Should be pulled from profiles.artist_status
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_audition_details_listing_id ON audition_details(listing_id);

-- ============================================================================
-- CREATIVE OPPORTUNITY DETAILS
-- ============================================================================

CREATE TABLE creative_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL UNIQUE REFERENCES listings(id) ON DELETE CASCADE,
  
  -- Core fields
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  host TEXT NOT NULL,
  dates TEXT NOT NULL,
  compensation TEXT NOT NULL,
  requirements TEXT NOT NULL,
  link TEXT NOT NULL,
  
  -- Fee information
  -- Note: fee can be NULL (for NO_FEE), or one of PAY_FEE, PROVIDE, EXPLAIN
  fee listing_fee_option,
  fee_amount TEXT,
  artist_type artist_type,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_creative_details_listing_id ON creative_details(listing_id);

-- ============================================================================
-- PERFORMANCE DETAILS
-- ============================================================================

CREATE TABLE performance_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL UNIQUE REFERENCES listings(id) ON DELETE CASCADE,
  
  -- Subtype: ORGANIZER or PIECE
  subtype performance_subtype NOT NULL,
  
  -- Core fields (for ORGANIZER)
  title TEXT,
  description TEXT,
  organizer TEXT,
  website TEXT,
  link TEXT,
  price TEXT,
  participants TEXT,
  
  -- Event type (for ORGANIZER)
  event_type performance_event_type,
  
  -- Agreement flags
  agree_comp_tickets BOOLEAN DEFAULT FALSE,
  event_dates_confirmed BOOLEAN DEFAULT FALSE,
  
  -- Listing fee information
  artist_type artist_type,
  listing_fee_option listing_fee_option,
  listing_fee_explanation TEXT,
  complementary_ticket_info TEXT,
  guest_spot_info TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT performance_details_subtype_check CHECK (
    (subtype = 'ORGANIZER' AND title IS NOT NULL) OR
    (subtype = 'PIECE')
  )
);

CREATE INDEX idx_performance_details_listing_id ON performance_details(listing_id);
CREATE INDEX idx_performance_details_subtype ON performance_details(subtype);

-- ============================================================================
-- PIECE DETAILS (for PIECE subtype)
-- ============================================================================
-- Additional details for pieces that are part of a parent performance

CREATE TABLE piece_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL UNIQUE REFERENCES listings(id) ON DELETE CASCADE,
  parent_listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  
  -- Parent event information (if manually entered)
  parent_event_name TEXT,
  parent_event_website TEXT,
  parent_event_ticket_link TEXT,
  parent_event_contact_email TEXT,
  
  -- Schedule mode
  piece_schedule_mode TEXT, -- 'FROM_PARENT' or 'CUSTOM'
  selected_slots JSONB, -- Array of selected slot keys from parent schedule
  
  -- Piece-specific information
  piece_title TEXT,
  piece_company TEXT,
  piece_company_website TEXT,
  piece_description TEXT,
  choreographer TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Note: For pieces submitted without a parent, parent_event_name and related fields
  -- are populated so admin can find/connect to parent later when parent submits listing
  CONSTRAINT piece_details_parent_check CHECK (
    (parent_listing_id IS NOT NULL) OR
    (parent_event_name IS NOT NULL AND parent_event_contact_email IS NOT NULL)
  )
);

CREATE INDEX idx_piece_details_listing_id ON piece_details(listing_id);
CREATE INDEX idx_piece_details_parent_listing_id ON piece_details(parent_listing_id);

-- ============================================================================
-- CLASS/WORKSHOP DETAILS
-- ============================================================================

CREATE TABLE class_workshop_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL UNIQUE REFERENCES listings(id) ON DELETE CASCADE,
  
  -- Type
  class_workshop_type class_workshop_type NOT NULL,
  
  -- Core fields
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  organizer TEXT NOT NULL,
  teachers TEXT NOT NULL,
  price TEXT,
  link TEXT,
  style_category TEXT,
  
  -- Workshop-specific fields
  workshop_details TEXT,
  classes_offered TEXT,
  drop_in_classes TEXT,
  
  -- Listing fee information
  artist_type artist_type,
  listing_fee_option listing_fee_option,
  listing_fee_explanation TEXT,
  guest_spot_info TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_class_workshop_details_listing_id ON class_workshop_details(listing_id);
CREATE INDEX idx_class_workshop_details_type ON class_workshop_details(class_workshop_type);

-- ============================================================================
-- PARENT-CHILD RELATIONSHIPS
-- ============================================================================
-- Generic table to track parent-child relationships
-- Supports:
-- - Performance (ORGANIZER) -> Pieces (PIECE)
-- - Workshop -> Classes

CREATE TABLE listing_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  child_listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL, -- 'performance_piece', 'workshop_class'
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  CONSTRAINT listing_relationships_unique UNIQUE (parent_listing_id, child_listing_id, relationship_type),
  CONSTRAINT listing_relationships_no_self_reference CHECK (parent_listing_id != child_listing_id)
);

CREATE INDEX idx_listing_relationships_parent ON listing_relationships(parent_listing_id);
CREATE INDEX idx_listing_relationships_child ON listing_relationships(child_listing_id);
CREATE INDEX idx_listing_relationships_type ON listing_relationships(relationship_type);

-- ============================================================================
-- MERGE TRACKING
-- ============================================================================
-- Tracks when admin merges duplicate listings
-- The "source" listing is merged into the "target" listing

CREATE TABLE listing_merges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  target_listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  merged_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  merge_reason TEXT,
  merged_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT listing_merges_no_self_merge CHECK (source_listing_id != target_listing_id)
);

CREATE INDEX idx_listing_merges_source ON listing_merges(source_listing_id);
CREATE INDEX idx_listing_merges_target ON listing_merges(target_listing_id);
CREATE INDEX idx_listing_merges_merged_by ON listing_merges(merged_by);

-- ============================================================================
-- REVIEWS TABLE (Audit Trail)
-- ============================================================================
-- Tracks admin review decisions for audit purposes
-- The actual status update happens in listings table (reviewed_at, reviewed_by)

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  decision TEXT NOT NULL CHECK (decision IN ('APPROVED', 'REJECTED')),
  notes TEXT,
  reviewer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_reviews_listing_id ON reviews(listing_id);
CREATE INDEX idx_reviews_reviewer_user_id ON reviews(reviewer_user_id);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audition_details_updated_at
  BEFORE UPDATE ON audition_details
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creative_details_updated_at
  BEFORE UPDATE ON creative_details
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_details_updated_at
  BEFORE UPDATE ON performance_details
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_piece_details_updated_at
  BEFORE UPDATE ON piece_details
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_workshop_details_updated_at
  BEFORE UPDATE ON class_workshop_details
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Note: Adjust these policies based on your specific security requirements

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE audition_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE piece_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_workshop_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_merges ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Example policies (customize as needed):
-- Users can read approved listings
CREATE POLICY "Users can read approved listings"
  ON listings FOR SELECT
  USING (status = 'approved' AND deleted_at IS NULL);

-- Users can create their own listings
CREATE POLICY "Users can create their own listings"
  ON listings FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Users can update their own listings
CREATE POLICY "Users can update their own listings"
  ON listings FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Admins have full access
CREATE POLICY "Admins have full access to listings"
  ON listings FOR ALL
  USING (public.is_admin());

-- Reviews policies
-- Admins can read all reviews
CREATE POLICY "Admins can read all reviews"
  ON reviews FOR SELECT
  USING (public.is_admin());

-- Admins can create reviews
CREATE POLICY "Admins can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (public.is_admin());

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE listings IS 'Base table for all listing types (audition, creative, performance, class)';
COMMENT ON TABLE listing_photos IS 'Photos associated with listings';
COMMENT ON TABLE listing_occurrences IS 'Date/time occurrences for listings. Can be event occurrences or deadlines. Each occurrence can have its own location.';
COMMENT ON TABLE audition_details IS 'Type-specific details for audition listings';
COMMENT ON TABLE creative_details IS 'Type-specific details for creative opportunity listings';
COMMENT ON TABLE performance_details IS 'Type-specific details for performance listings (ORGANIZER or PIECE)';
COMMENT ON TABLE piece_details IS 'Additional details for PIECE subtype performances';
COMMENT ON COLUMN piece_details.piece_title IS 'Title of the piece/performance';
COMMENT ON COLUMN piece_details.piece_company IS 'Company or artist name for this piece';
COMMENT ON COLUMN piece_details.piece_company_website IS 'Website for the company/artist';
COMMENT ON COLUMN piece_details.piece_description IS 'Description of the piece';
COMMENT ON COLUMN piece_details.choreographer IS 'Choreographer or creator name (if different from company)';
COMMENT ON TABLE class_workshop_details IS 'Type-specific details for class/workshop listings';
COMMENT ON TABLE listing_relationships IS 'Tracks parent-child relationships (e.g., Performance->Pieces, Workshop->Classes)';
COMMENT ON TABLE listing_merges IS 'Tracks admin merge operations for duplicate listings';
COMMENT ON TABLE reviews IS 'Audit trail of admin review decisions for listings';
