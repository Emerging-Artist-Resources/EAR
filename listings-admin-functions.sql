-- ============================================================================
-- ADMIN FUNCTIONS FOR LISTINGS
-- ============================================================================
-- Helper functions for common admin operations:
-- 1. Merge duplicate listings
-- 2. Add child to parent
-- 3. Remove child from parent
-- 4. Get listing hierarchy
-- ============================================================================

-- ============================================================================
-- FUNCTION: Merge Duplicate Listings
-- ============================================================================
-- Merges source listing into target listing
-- Moves all relationships, photos, occurrences to target
-- Soft deletes source listing
-- Returns summary of merge operation

CREATE OR REPLACE FUNCTION merge_listings(
  p_source_listing_id UUID,
  p_target_listing_id UUID,
  p_merged_by UUID,
  p_merge_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_photos_moved INTEGER;
  v_occurrences_moved INTEGER;
  v_relationships_moved INTEGER;
  v_source_type listing_type;
  v_target_type listing_type;
BEGIN
  -- Validate inputs
  IF p_source_listing_id = p_target_listing_id THEN
    RAISE EXCEPTION 'Cannot merge listing with itself';
  END IF;

  -- Check that listings exist and are not deleted
  SELECT type INTO v_source_type FROM listings WHERE id = p_source_listing_id AND deleted_at IS NULL;
  IF v_source_type IS NULL THEN
    RAISE EXCEPTION 'Source listing not found or already deleted';
  END IF;

  SELECT type INTO v_target_type FROM listings WHERE id = p_target_listing_id AND deleted_at IS NULL;
  IF v_target_type IS NULL THEN
    RAISE EXCEPTION 'Target listing not found or already deleted';
  END IF;

  -- Check that types match
  IF v_source_type != v_target_type THEN
    RAISE EXCEPTION 'Cannot merge listings of different types: % and %', v_source_type, v_target_type;
  END IF;

  -- Move photos
  UPDATE listing_photos
  SET listing_id = p_target_listing_id
  WHERE listing_id = p_source_listing_id;
  GET DIAGNOSTICS v_photos_moved = ROW_COUNT;

  -- Move occurrences
  UPDATE listing_occurrences
  SET listing_id = p_target_listing_id
  WHERE listing_id = p_source_listing_id;
  GET DIAGNOSTICS v_occurrences_moved = ROW_COUNT;

  -- Update relationships where source is parent
  UPDATE listing_relationships
  SET parent_listing_id = p_target_listing_id
  WHERE parent_listing_id = p_source_listing_id;
  GET DIAGNOSTICS v_relationships_moved = ROW_COUNT;

  -- Update relationships where source is child
  UPDATE listing_relationships
  SET child_listing_id = p_target_listing_id
  WHERE child_listing_id = p_source_listing_id;
  v_relationships_moved := v_relationships_moved + ROW_COUNT;

  -- Update piece_details if source is a piece
  UPDATE piece_details
  SET parent_listing_id = p_target_listing_id
  WHERE parent_listing_id = p_source_listing_id;

  -- Create merge record
  INSERT INTO listing_merges (source_listing_id, target_listing_id, merged_by, merge_reason)
  VALUES (p_source_listing_id, p_target_listing_id, p_merged_by, p_merge_reason);

  -- Soft delete source listing
  UPDATE listings
  SET deleted_at = NOW()
  WHERE id = p_source_listing_id;

  -- Build result
  v_result := jsonb_build_object(
    'success', true,
    'source_listing_id', p_source_listing_id,
    'target_listing_id', p_target_listing_id,
    'photos_moved', v_photos_moved,
    'occurrences_moved', v_occurrences_moved,
    'relationships_moved', v_relationships_moved
  );

  RETURN v_result;
END;
$$;

-- ============================================================================
-- FUNCTION: Add Child to Parent
-- ============================================================================
-- Creates a parent-child relationship between two listings
-- Validates that the relationship type is valid for the listing types

CREATE OR REPLACE FUNCTION add_listing_child(
  p_parent_listing_id UUID,
  p_child_listing_id UUID,
  p_relationship_type TEXT,
  p_created_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_parent_type listing_type;
  v_child_type listing_type;
  v_parent_subtype performance_subtype;
  v_child_subtype performance_subtype;
  v_parent_class_type class_workshop_type;
  v_child_class_type class_workshop_type;
BEGIN
  -- Validate inputs
  IF p_parent_listing_id = p_child_listing_id THEN
    RAISE EXCEPTION 'Listing cannot be its own child';
  END IF;

  -- Check that listings exist
  SELECT type INTO v_parent_type FROM listings WHERE id = p_parent_listing_id AND deleted_at IS NULL;
  IF v_parent_type IS NULL THEN
    RAISE EXCEPTION 'Parent listing not found or deleted';
  END IF;

  SELECT type INTO v_child_type FROM listings WHERE id = p_child_listing_id AND deleted_at IS NULL;
  IF v_child_type IS NULL THEN
    RAISE EXCEPTION 'Child listing not found or deleted';
  END IF;

  -- Validate relationship type
  IF p_relationship_type = 'performance_piece' THEN
    -- Parent must be performance ORGANIZER, child must be performance PIECE
    SELECT subtype INTO v_parent_subtype FROM performance_details WHERE listing_id = p_parent_listing_id;
    SELECT subtype INTO v_child_subtype FROM performance_details WHERE listing_id = p_child_listing_id;
    
    IF v_parent_type != 'performance' OR v_parent_subtype != 'ORGANIZER' THEN
      RAISE EXCEPTION 'Parent must be a performance ORGANIZER';
    END IF;
    
    IF v_child_type != 'performance' OR v_child_subtype != 'PIECE' THEN
      RAISE EXCEPTION 'Child must be a performance PIECE';
    END IF;

    -- Update or create piece_details
    INSERT INTO piece_details (listing_id, parent_listing_id)
    VALUES (p_child_listing_id, p_parent_listing_id)
    ON CONFLICT (listing_id) 
    DO UPDATE SET parent_listing_id = p_parent_listing_id;

  ELSIF p_relationship_type = 'workshop_class' THEN
    -- Parent must be WORKSHOP, child must be CLASS
    SELECT class_workshop_type INTO v_parent_class_type FROM class_workshop_details WHERE listing_id = p_parent_listing_id;
    SELECT class_workshop_type INTO v_child_class_type FROM class_workshop_details WHERE listing_id = p_child_listing_id;
    
    IF v_parent_type != 'class' OR v_parent_class_type != 'WORKSHOP' THEN
      RAISE EXCEPTION 'Parent must be a WORKSHOP';
    END IF;
    
    IF v_child_type != 'class' OR v_child_class_type != 'CLASS' THEN
      RAISE EXCEPTION 'Child must be a CLASS';
    END IF;

  ELSE
    RAISE EXCEPTION 'Invalid relationship type: %', p_relationship_type;
  END IF;

  -- Create relationship (or update if exists)
  INSERT INTO listing_relationships (parent_listing_id, child_listing_id, relationship_type, created_by)
  VALUES (p_parent_listing_id, p_child_listing_id, p_relationship_type, p_created_by)
  ON CONFLICT (parent_listing_id, child_listing_id, relationship_type) DO NOTHING;

  v_result := jsonb_build_object(
    'success', true,
    'parent_listing_id', p_parent_listing_id,
    'child_listing_id', p_child_listing_id,
    'relationship_type', p_relationship_type
  );

  RETURN v_result;
END;
$$;

-- ============================================================================
-- FUNCTION: Remove Child from Parent
-- ============================================================================
-- Removes a parent-child relationship

CREATE OR REPLACE FUNCTION remove_listing_child(
  p_parent_listing_id UUID,
  p_child_listing_id UUID,
  p_relationship_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_deleted INTEGER;
BEGIN
  -- Delete relationship
  DELETE FROM listing_relationships
  WHERE parent_listing_id = p_parent_listing_id
    AND child_listing_id = p_child_listing_id
    AND relationship_type = p_relationship_type;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  -- If it's a piece, clear parent_listing_id in piece_details
  IF p_relationship_type = 'performance_piece' THEN
    UPDATE piece_details
    SET parent_listing_id = NULL
    WHERE listing_id = p_child_listing_id AND parent_listing_id = p_parent_listing_id;
  END IF;

  v_result := jsonb_build_object(
    'success', true,
    'deleted', v_deleted > 0
  );

  RETURN v_result;
END;
$$;

-- ============================================================================
-- FUNCTION: Get Listing Hierarchy
-- ============================================================================
-- Returns a listing with all its children in a hierarchical structure

CREATE OR REPLACE FUNCTION get_listing_hierarchy(
  p_listing_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_listing JSONB;
  v_children JSONB;
BEGIN
  -- Get listing details
  SELECT to_jsonb(l.*) INTO v_listing
  FROM listings l
  WHERE l.id = p_listing_id AND l.deleted_at IS NULL;

  IF v_listing IS NULL THEN
    RAISE EXCEPTION 'Listing not found or deleted';
  END IF;

  -- Get children
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', child.id,
      'type', child.type,
      'status', child.status,
      'title', CASE
        WHEN child.type = 'audition' THEN (SELECT title FROM audition_details WHERE listing_id = child.id)
        WHEN child.type = 'creative' THEN (SELECT title FROM creative_details WHERE listing_id = child.id)
        WHEN child.type = 'performance' THEN (SELECT title FROM performance_details WHERE listing_id = child.id)
        WHEN child.type = 'class' THEN (SELECT title FROM class_workshop_details WHERE listing_id = child.id)
        ELSE NULL
      END,
      'relationship_type', lr.relationship_type,
      'created_at', lr.created_at
    )
  ) INTO v_children
  FROM listing_relationships lr
  JOIN listings child ON lr.child_listing_id = child.id
  WHERE lr.parent_listing_id = p_listing_id
    AND child.deleted_at IS NULL;

  -- Build result
  v_result := jsonb_build_object(
    'listing', v_listing,
    'children', COALESCE(v_children, '[]'::jsonb)
  );

  RETURN v_result;
END;
$$;

-- ============================================================================
-- FUNCTION: Get Listing with All Details
-- ============================================================================
-- Returns a complete listing with all type-specific details

CREATE OR REPLACE FUNCTION get_listing_full(
  p_listing_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_listing JSONB;
  v_details JSONB;
  v_photos JSONB;
  v_occurrences JSONB;
  v_listing_type listing_type;
BEGIN
  -- Get listing
  SELECT to_jsonb(l.*), l.type INTO v_listing, v_listing_type
  FROM listings l
  WHERE l.id = p_listing_id AND l.deleted_at IS NULL;

  IF v_listing IS NULL THEN
    RAISE EXCEPTION 'Listing not found or deleted';
  END IF;

  -- Get type-specific details
  CASE v_listing_type
    WHEN 'audition' THEN
      SELECT to_jsonb(ad.*) INTO v_details FROM audition_details ad WHERE ad.listing_id = p_listing_id;
    WHEN 'creative' THEN
      SELECT to_jsonb(cd.*) INTO v_details FROM creative_details cd WHERE cd.listing_id = p_listing_id;
    WHEN 'performance' THEN
      SELECT to_jsonb(pd.*) INTO v_details FROM performance_details pd WHERE pd.listing_id = p_listing_id;
      -- Add piece details if it's a piece
      IF (v_details->>'subtype')::text = 'PIECE' THEN
        SELECT jsonb_build_object(
          'piece_details', to_jsonb(pd2.*)
        ) INTO v_details
        FROM piece_details pd2
        WHERE pd2.listing_id = p_listing_id;
      END IF;
    WHEN 'class' THEN
      SELECT to_jsonb(cwd.*) INTO v_details FROM class_workshop_details cwd WHERE cwd.listing_id = p_listing_id;
    ELSE
      v_details := '{}'::jsonb;
  END CASE;

  -- Get photos
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'path', path,
      'credit', credit,
      'sort_order', sort_order
    ) ORDER BY sort_order
  ) INTO v_photos
  FROM listing_photos
  WHERE listing_id = p_listing_id;

  -- Get occurrences (including location fields)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'occurrence_type', occurrence_type,
      'starts_at_utc', starts_at_utc,
      'ends_at_utc', ends_at_utc,
      'tz', tz,
      'address', address,
      'place_id', place_id,
      'lat', lat,
      'lng', lng,
      'venue_name', venue_name,
      'location_instructions', location_instructions
    ) ORDER BY starts_at_utc
  ) INTO v_occurrences
  FROM listing_occurrences
  WHERE listing_id = p_listing_id;

  -- Build result
  v_result := jsonb_build_object(
    'listing', v_listing,
    'details', COALESCE(v_details, '{}'::jsonb),
    'photos', COALESCE(v_photos, '[]'::jsonb),
    'occurrences', COALESCE(v_occurrences, '[]'::jsonb)
  );

  RETURN v_result;
END;
$$;

