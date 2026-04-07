


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "citext" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."announcement_type" AS ENUM (
    'INFO',
    'WARNING',
    'SUCCESS',
    'ERROR'
);


ALTER TYPE "public"."announcement_type" OWNER TO "postgres";


CREATE TYPE "public"."artist_status" AS ENUM (
    'emerging',
    'established'
);


ALTER TYPE "public"."artist_status" OWNER TO "postgres";


CREATE TYPE "public"."artist_type" AS ENUM (
    'ESTABLISHED',
    'EMERGING'
);


ALTER TYPE "public"."artist_type" OWNER TO "postgres";


CREATE TYPE "public"."class_workshop_type" AS ENUM (
    'CLASS',
    'WORKSHOP'
);


ALTER TYPE "public"."class_workshop_type" OWNER TO "postgres";


CREATE TYPE "public"."donation_stripe_account" AS ENUM (
    'ear',
    'sponsor'
);


ALTER TYPE "public"."donation_stripe_account" OWNER TO "postgres";


CREATE TYPE "public"."event_status" AS ENUM (
    'DRAFT',
    'PENDING',
    'APPROVED',
    'REJECTED',
    'ARCHIVED'
);


ALTER TYPE "public"."event_status" OWNER TO "postgres";


CREATE TYPE "public"."event_type" AS ENUM (
    'performance',
    'audition',
    'creative',
    'class',
    'funding'
);


ALTER TYPE "public"."event_type" OWNER TO "postgres";


CREATE TYPE "public"."fiscal_sponsorship_status" AS ENUM (
    'none',
    'pending',
    'approved',
    'paused',
    'revoked'
);


ALTER TYPE "public"."fiscal_sponsorship_status" OWNER TO "postgres";


CREATE TYPE "public"."listing_fee_option" AS ENUM (
    'PAY_FEE',
    'PROVIDE',
    'EXPLAIN'
);


ALTER TYPE "public"."listing_fee_option" OWNER TO "postgres";


CREATE TYPE "public"."listing_status" AS ENUM (
    'pending',
    'approved',
    'rejected',
    'draft',
    'pending_payment'
);


ALTER TYPE "public"."listing_status" OWNER TO "postgres";


CREATE TYPE "public"."listing_type" AS ENUM (
    'audition',
    'creative',
    'performance',
    'class'
);


ALTER TYPE "public"."listing_type" OWNER TO "postgres";


CREATE TYPE "public"."occurrence_type" AS ENUM (
    'event',
    'deadline'
);


ALTER TYPE "public"."occurrence_type" OWNER TO "postgres";


CREATE TYPE "public"."operating_budget_range" AS ENUM (
    'r_0_24999',
    'r_25000_49999',
    'r_50000_99999',
    'r_100000_499999',
    'r_500000_999999',
    'r_1000000_1999999',
    'r_2000000_plus',
    'other'
);


ALTER TYPE "public"."operating_budget_range" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'not_required',
    'requires_payment',
    'paid',
    'refunded',
    'canceled'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."performance_event_type" AS ENUM (
    'SOLO',
    'SPLIT_BILL',
    'FESTIVAL'
);


ALTER TYPE "public"."performance_event_type" OWNER TO "postgres";


CREATE TYPE "public"."performance_subtype" AS ENUM (
    'ORGANIZER',
    'PIECE'
);


ALTER TYPE "public"."performance_subtype" OWNER TO "postgres";


CREATE TYPE "public"."profile_type" AS ENUM (
    'individual',
    'company',
    'festival',
    'other'
);


ALTER TYPE "public"."profile_type" OWNER TO "postgres";


CREATE TYPE "public"."referral_source" AS ENUM (
    'instagram',
    'word_of_mouth',
    'google',
    'other'
);


ALTER TYPE "public"."referral_source" OWNER TO "postgres";


CREATE TYPE "public"."review_decision" AS ENUM (
    'APPROVED',
    'REJECTED'
);


ALTER TYPE "public"."review_decision" OWNER TO "postgres";


CREATE TYPE "public"."review_status" AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE "public"."review_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'admin',
    'user'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE TYPE "public"."yes_no_other" AS ENUM (
    'yes',
    'no',
    'other'
);


ALTER TYPE "public"."yes_no_other" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_listing_child"("p_parent_listing_id" "uuid", "p_child_listing_id" "uuid", "p_relationship_type" "text", "p_created_by" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."add_listing_child"("p_parent_listing_id" "uuid", "p_child_listing_id" "uuid", "p_relationship_type" "text", "p_created_by" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cancel_stale_donations"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_count integer;
begin
  update public.donations
  set payment_status = 'canceled'
  where payment_status = 'requires_payment'
    and created_at < now() - interval '24 hours'
    and stripe_checkout_session_id is not null;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;


ALTER FUNCTION "public"."cancel_stale_donations"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."clear_resubmission_required_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  update public.profiles
  set eligibility_resubmission_required_at = null
  where id = new.profile_id;

  return new;
end;
$$;


ALTER FUNCTION "public"."clear_resubmission_required_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."debug_whoami"() RETURNS "jsonb"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
  SELECT jsonb_build_object(
    'uid', auth.uid(),
    'role', auth.role()
  );
$$;


ALTER FUNCTION "public"."debug_whoami"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_eligibility_submission_rate_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  is_admin boolean;
  last_submitted timestamptz;
  required_at timestamptz;
begin
  -- Admins can always insert
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  ) into is_admin;

  if is_admin then
    return new;
  end if;

  -- Users can only submit for themselves
  if new.profile_id <> auth.uid() then
    raise exception 'Not allowed';
  end if;

  -- Optional admin override: allow submission once required_at has passed
  select p.eligibility_resubmission_required_at
    into required_at
  from public.profiles p
  where p.id = new.profile_id;

  if required_at is not null and now() >= required_at then
    return new;
  end if;

  -- Enforce 1 submission per year (365 days rolling)
  select max(submitted_at)
    into last_submitted
  from public.emerging_eligibility_submissions
  where profile_id = new.profile_id;

  if last_submitted is not null and last_submitted > (now() - interval '1 year') then
    raise exception 'You can only update your eligibility once per year.';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."enforce_eligibility_submission_rate_limit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_listing_full"("p_listing_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."get_listing_full"("p_listing_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_listing_hierarchy"("p_listing_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."get_listing_hierarchy"("p_listing_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.profiles (
    id,
    name,
    email
  )
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1),
      'User'
    ),
    new.email
  )
  on conflict (id) do nothing;

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()  -- Fixed: use p.id, not p.user_id
      AND p.role = 'admin'   -- Fixed: use lowercase 'admin', not 'ADMIN'
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."merge_listings"("p_source_listing_id" "uuid", "p_target_listing_id" "uuid", "p_merged_by" "uuid", "p_merge_reason" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."merge_listings"("p_source_listing_id" "uuid", "p_target_listing_id" "uuid", "p_merged_by" "uuid", "p_merge_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_listing_child"("p_parent_listing_id" "uuid", "p_child_listing_id" "uuid", "p_relationship_type" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."remove_listing_child"("p_parent_listing_id" "uuid", "p_child_listing_id" "uuid", "p_relationship_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."test_listings_insert_policy"("test_created_by" "uuid") RETURNS "jsonb"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
  SELECT jsonb_build_object(
    'auth_uid', auth.uid(),
    'test_created_by', test_created_by,
    'values_match', auth.uid() = test_created_by,
    'auth_uid_is_null', auth.uid() IS NULL,
    'test_created_by_is_null', test_created_by IS NULL,
    'policy_should_pass', (auth.uid() = test_created_by) AND (auth.uid() IS NOT NULL)
  );
$$;


ALTER FUNCTION "public"."test_listings_insert_policy"("test_created_by" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."announcements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "type" "public"."announcement_type" DEFAULT 'INFO'::"public"."announcement_type" NOT NULL,
    "published_at" timestamp with time zone,
    "archived_at" timestamp with time zone,
    "author_user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."announcements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audition_details" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "eligibility" "text" NOT NULL,
    "compensation" "text" NOT NULL,
    "instructions" "text" NOT NULL,
    "pre_audition_classes" "text",
    "fee" "public"."listing_fee_option",
    "fee_amount" "text",
    "artist_type" "public"."artist_type" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."audition_details" OWNER TO "postgres";


COMMENT ON TABLE "public"."audition_details" IS 'Type-specific details for audition listings';



COMMENT ON COLUMN "public"."audition_details"."artist_type" IS 'Should be pulled from profiles.artist_status when creating the listing. Values: EMERGING or ESTABLISHED';



CREATE TABLE IF NOT EXISTS "public"."class_workshop_details" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "class_workshop_type" "public"."class_workshop_type" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "organizer" "text" NOT NULL,
    "teachers" "text" NOT NULL,
    "price" "text",
    "link" "text",
    "style_category" "text",
    "workshop_details" "text",
    "classes_offered" "text",
    "drop_in_classes" "text",
    "artist_type" "public"."artist_type",
    "listing_fee_option" "public"."listing_fee_option",
    "listing_fee_explanation" "text",
    "guest_spot_info" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "parent_listing_id" "uuid",
    "parent_workshop_name" "text",
    "parent_workshop_website" "text",
    "parent_workshop_contact_email" "text",
    CONSTRAINT "class_workshop_details_parent_check" CHECK ((("class_workshop_type" = 'WORKSHOP'::"public"."class_workshop_type") OR ("parent_listing_id" IS NOT NULL) OR ("parent_workshop_name" IS NOT NULL)))
);


ALTER TABLE "public"."class_workshop_details" OWNER TO "postgres";


COMMENT ON TABLE "public"."class_workshop_details" IS 'Type-specific details for class/workshop listings';



CREATE TABLE IF NOT EXISTS "public"."creative_details" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "host" "text" NOT NULL,
    "dates" "text" NOT NULL,
    "compensation" "text" NOT NULL,
    "requirements" "text" NOT NULL,
    "link" "text" NOT NULL,
    "fee" "public"."listing_fee_option",
    "fee_amount" "text",
    "artist_type" "public"."artist_type",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."creative_details" OWNER TO "postgres";


COMMENT ON TABLE "public"."creative_details" IS 'Type-specific details for creative opportunity listings';



CREATE TABLE IF NOT EXISTS "public"."donations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "amount" integer NOT NULL,
    "currency" "text" DEFAULT 'usd'::"text" NOT NULL,
    "payment_status" "public"."payment_status" DEFAULT 'requires_payment'::"public"."payment_status" NOT NULL,
    "stripe_checkout_session_id" "text",
    "stripe_payment_intent_id" "text",
    "stripe_charge_id" "text",
    "donor_id" "uuid",
    "donor_name" "text",
    "donor_email" "text",
    "message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "recipient_user_id" "uuid",
    "recipient_name" "text",
    "cover_card_fee" boolean DEFAULT false NOT NULL,
    "cover_fiscal_fee" boolean DEFAULT false NOT NULL,
    "donor_receipt_sent_at" timestamp with time zone,
    "internal_notification_sent_at" timestamp with time zone,
    "base_gift_cents" integer NOT NULL,
    "fee_model_version" smallint DEFAULT 1 NOT NULL,
    "stripe_account" "public"."donation_stripe_account" NOT NULL,
    CONSTRAINT "donations_amount_positive" CHECK (("amount" > 0)),
    CONSTRAINT "donations_currency_lowercase" CHECK (("currency" = "lower"("currency")))
);


ALTER TABLE "public"."donations" OWNER TO "postgres";


COMMENT ON TABLE "public"."donations" IS 'Donation records with payment tracking via Stripe';



COMMENT ON COLUMN "public"."donations"."id" IS 'Unique donation identifier';



COMMENT ON COLUMN "public"."donations"."amount" IS 'For fee_model_version 1: legacy semantics (historically base gift). For fee_model_version 2: total charged in cents (Stripe amount_total after payment; estimate from computeGrossChargeCents before pay)';



COMMENT ON COLUMN "public"."donations"."currency" IS 'Donation currency (default: usd, must be lowercase)';



COMMENT ON COLUMN "public"."donations"."payment_status" IS 'Current payment status: not_required, requires_payment, paid, refunded, or canceled';



COMMENT ON COLUMN "public"."donations"."stripe_checkout_session_id" IS 'Stripe Checkout session ID (set when creating session)';



COMMENT ON COLUMN "public"."donations"."stripe_payment_intent_id" IS 'Stripe Payment Intent ID (set from webhook, source of truth)';



COMMENT ON COLUMN "public"."donations"."stripe_charge_id" IS 'Stripe Charge ID (set from payment_intent.succeeded webhook for easier refund mapping)';



COMMENT ON COLUMN "public"."donations"."donor_id" IS 'Profile ID of authenticated donor (nullable for anonymous donations)';



COMMENT ON COLUMN "public"."donations"."donor_name" IS 'Donor name (optional, may be provided for anonymous donations)';



COMMENT ON COLUMN "public"."donations"."donor_email" IS 'Donor email (optional, may be provided for anonymous donations)';



COMMENT ON COLUMN "public"."donations"."message" IS 'Optional message from donor';



COMMENT ON COLUMN "public"."donations"."created_at" IS 'Timestamp when donation record was created';



COMMENT ON COLUMN "public"."donations"."recipient_user_id" IS 'Artist/recipient profile for fiscally sponsored donation (canonical)';



COMMENT ON COLUMN "public"."donations"."recipient_name" IS 'Optional display snapshot at donation time';



COMMENT ON COLUMN "public"."donations"."cover_card_fee" IS 'When true with sponsor Stripe: donor covers processing fees (2.9% + $0.30) via gross-up';



COMMENT ON COLUMN "public"."donations"."cover_fiscal_fee" IS 'True when donor opts to cover 5.5% fiscal sponsorship fee';



COMMENT ON COLUMN "public"."donations"."donor_receipt_sent_at" IS 'When Postmark donor receipt was claimed/sent; null if not yet sent or rolled back after failure';



COMMENT ON COLUMN "public"."donations"."internal_notification_sent_at" IS 'When internal artist/admin Postmark template+PDF was claimed/sent; null if not sent';



COMMENT ON COLUMN "public"."donations"."base_gift_cents" IS 'Intended donation in cents (donor-entered gift amount)';



COMMENT ON COLUMN "public"."donations"."fee_model_version" IS '1 = legacy row (amount column may mean base gift only). 2 = amount is total charged / Stripe total';



COMMENT ON COLUMN "public"."donations"."stripe_account" IS 'ear = EAR Stripe account (generic donations); sponsor = fiscal sponsor Stripe account (artist donations)';



CREATE TABLE IF NOT EXISTS "public"."emerging_eligibility_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "submitted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "change_summary" "text",
    "version" integer DEFAULT 1 NOT NULL,
    "self_identifies_emerging" boolean NOT NULL,
    "operating_budget_range" "public"."operating_budget_range" NOT NULL,
    "operating_budget_other_text" "text",
    "owns_or_operates_venue" "public"."yes_no_other" NOT NULL,
    "owns_or_operates_venue_other_text" "text",
    "supported_by_major_institution" "public"."yes_no_other" NOT NULL,
    "supported_by_major_institution_other_text" "text",
    "classes_hosted_independently" "public"."yes_no_other" NOT NULL,
    "classes_hosted_independently_other_text" "text",
    "has_501c3" "public"."yes_no_other" NOT NULL,
    "has_501c3_other_text" "text",
    "suggested_status" "public"."artist_status",
    "reviewed_at" timestamp with time zone,
    "reviewed_by" "uuid",
    "decision" "public"."review_decision",
    "decision_note" "text",
    "final_status" "public"."artist_status"
);


ALTER TABLE "public"."emerging_eligibility_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."listing_merges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_listing_id" "uuid" NOT NULL,
    "target_listing_id" "uuid" NOT NULL,
    "merged_by" "uuid" NOT NULL,
    "merge_reason" "text",
    "merged_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "listing_merges_no_self_merge" CHECK (("source_listing_id" <> "target_listing_id"))
);


ALTER TABLE "public"."listing_merges" OWNER TO "postgres";


COMMENT ON TABLE "public"."listing_merges" IS 'Tracks admin merge operations for duplicate listings';



CREATE TABLE IF NOT EXISTS "public"."listing_occurrences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "occurrence_type" "public"."occurrence_type" DEFAULT 'event'::"public"."occurrence_type" NOT NULL,
    "starts_at_utc" timestamp with time zone NOT NULL,
    "ends_at_utc" timestamp with time zone,
    "tz" "text" NOT NULL,
    "address" "text",
    "place_id" "text",
    "lat" numeric(10,8),
    "lng" numeric(11,8),
    "venue_name" "text",
    "location_instructions" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "source_piece_listing_id" "uuid",
    "source_class_listing_id" "uuid"
);


ALTER TABLE "public"."listing_occurrences" OWNER TO "postgres";


COMMENT ON TABLE "public"."listing_occurrences" IS 'Date/time occurrences for listings. Can be event occurrences or deadlines. Each occurrence can have its own location.';



COMMENT ON COLUMN "public"."listing_occurrences"."source_piece_listing_id" IS 'If this occurrence was added by a piece submission, this references the piece listing_id. NULL for organizer-created occurrences.';



CREATE TABLE IF NOT EXISTS "public"."listing_photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "path" "text" NOT NULL,
    "credit" "text",
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "listing_photos_sort_order_check" CHECK ((("sort_order" >= 0) AND ("sort_order" < 10)))
);


ALTER TABLE "public"."listing_photos" OWNER TO "postgres";


COMMENT ON TABLE "public"."listing_photos" IS 'Photos associated with listings';



CREATE TABLE IF NOT EXISTS "public"."listing_relationships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_listing_id" "uuid" NOT NULL,
    "child_listing_id" "uuid" NOT NULL,
    "relationship_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    CONSTRAINT "listing_relationships_no_self_reference" CHECK (("parent_listing_id" <> "child_listing_id"))
);


ALTER TABLE "public"."listing_relationships" OWNER TO "postgres";


COMMENT ON TABLE "public"."listing_relationships" IS 'Tracks parent-child relationships (e.g., Performance->Pieces, Workshop->Classes)';



CREATE TABLE IF NOT EXISTS "public"."listings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "public"."listing_type" NOT NULL,
    "status" "public"."listing_status" DEFAULT 'pending'::"public"."listing_status" NOT NULL,
    "contact_name" "text" NOT NULL,
    "pronouns" "text",
    "contact_email" "text" NOT NULL,
    "company" "text",
    "company_website" "text",
    "address" "text",
    "place_id" "text",
    "lat" numeric(10,8),
    "lng" numeric(11,8),
    "venue_name" "text",
    "location_instructions" "text",
    "social_handles" "text",
    "notes" "text",
    "meta" "jsonb" DEFAULT '{}'::"jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "submitted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "reviewed_at" timestamp with time zone,
    "reviewed_by" "uuid",
    "deleted_at" timestamp with time zone,
    "payment_required" boolean DEFAULT false NOT NULL,
    "payment_amount" integer,
    "payment_currency" "text" DEFAULT 'usd'::"text" NOT NULL,
    "payment_status" "public"."payment_status" DEFAULT 'not_required'::"public"."payment_status" NOT NULL,
    "stripe_checkout_session_id" "text",
    "stripe_payment_intent_id" "text",
    "stripe_charge_id" "text",
    CONSTRAINT "listings_payment_amount_nonneg" CHECK ((("payment_amount" IS NULL) OR ("payment_amount" >= 0))),
    CONSTRAINT "listings_payment_currency_lowercase" CHECK (("payment_currency" = "lower"("payment_currency"))),
    CONSTRAINT "listings_payment_required_amount_consistency" CHECK (((("payment_required" = true) AND ("payment_amount" IS NOT NULL)) OR ("payment_required" = false)))
);


ALTER TABLE "public"."listings" OWNER TO "postgres";


COMMENT ON TABLE "public"."listings" IS 'Base table for all listing types (audition, creative, performance, class, funding)';



COMMENT ON COLUMN "public"."listings"."payment_required" IS 'Whether payment is required for this listing';



COMMENT ON COLUMN "public"."listings"."payment_amount" IS 'Payment amount in cents (nullable if no payment required)';



COMMENT ON COLUMN "public"."listings"."payment_currency" IS 'Payment currency (default: usd, must be lowercase)';



COMMENT ON COLUMN "public"."listings"."payment_status" IS 'Current payment status: not_required, requires_payment, paid, refunded, or canceled';



COMMENT ON COLUMN "public"."listings"."stripe_checkout_session_id" IS 'Stripe Checkout session ID (set when creating session)';



COMMENT ON COLUMN "public"."listings"."stripe_payment_intent_id" IS 'Stripe Payment Intent ID (set from webhook, source of truth)';



COMMENT ON COLUMN "public"."listings"."stripe_charge_id" IS 'Stripe Charge ID (set from payment_intent.succeeded webhook for easier refund mapping)';



CREATE TABLE IF NOT EXISTS "public"."performance_details" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "subtype" "public"."performance_subtype" NOT NULL,
    "title" "text",
    "description" "text",
    "organizer" "text",
    "website" "text",
    "link" "text",
    "price" "text",
    "participants" "text",
    "event_type" "public"."performance_event_type",
    "agree_comp_tickets" boolean DEFAULT false,
    "event_dates_confirmed" boolean DEFAULT false,
    "artist_type" "public"."artist_type",
    "listing_fee_option" "public"."listing_fee_option",
    "listing_fee_explanation" "text",
    "complementary_ticket_info" "text",
    "guest_spot_info" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "performance_details_subtype_check" CHECK (((("subtype" = 'ORGANIZER'::"public"."performance_subtype") AND ("title" IS NOT NULL)) OR ("subtype" = 'PIECE'::"public"."performance_subtype")))
);


ALTER TABLE "public"."performance_details" OWNER TO "postgres";


COMMENT ON TABLE "public"."performance_details" IS 'Type-specific details for performance listings (ORGANIZER or PIECE)';



CREATE TABLE IF NOT EXISTS "public"."piece_details" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "parent_listing_id" "uuid",
    "parent_event_name" "text",
    "parent_event_website" "text",
    "parent_event_ticket_link" "text",
    "parent_event_contact_email" "text",
    "piece_schedule_mode" "text",
    "selected_slots" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "piece_title" "text",
    "piece_company" "text",
    "piece_company_website" "text",
    "piece_description" "text",
    "choreographer" "text",
    CONSTRAINT "piece_details_parent_check" CHECK ((("parent_listing_id" IS NOT NULL) OR ("parent_event_name" IS NOT NULL)))
);


ALTER TABLE "public"."piece_details" OWNER TO "postgres";


COMMENT ON TABLE "public"."piece_details" IS 'Additional details for PIECE subtype performances';



COMMENT ON COLUMN "public"."piece_details"."piece_title" IS 'Title of the piece/performance';



COMMENT ON COLUMN "public"."piece_details"."piece_company" IS 'Company or artist name for this piece';



COMMENT ON COLUMN "public"."piece_details"."piece_company_website" IS 'Website for the company/artist';



COMMENT ON COLUMN "public"."piece_details"."piece_description" IS 'Description of the piece';



COMMENT ON COLUMN "public"."piece_details"."choreographer" IS 'Choreographer or creator name (if different from company)';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "role" "public"."user_role" DEFAULT 'user'::"public"."user_role" NOT NULL,
    "profile_type" "public"."profile_type" DEFAULT 'individual'::"public"."profile_type" NOT NULL,
    "artist_status" "public"."artist_status" DEFAULT 'emerging'::"public"."artist_status" NOT NULL,
    "artist_status_reviewed_at" timestamp with time zone,
    "artist_status_reviewed_by" "uuid",
    "artist_status_review_note" "text",
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "website" "text",
    "pronouns" "text",
    "organization_name" "text",
    "newsletter_ear_opt_in" boolean DEFAULT false NOT NULL,
    "newsletter_calendar_opt_in" boolean DEFAULT false NOT NULL,
    "referral_source" "public"."referral_source",
    "referral_source_other" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "eligibility_resubmission_required_at" timestamp with time zone,
    "location_place_id" "text",
    "location_label" "text",
    "slug" "text",
    "fiscal_sponsorship_status" "public"."fiscal_sponsorship_status" DEFAULT 'none'::"public"."fiscal_sponsorship_status" NOT NULL,
    "fiscal_sponsorship_approved_at" timestamp with time zone,
    "fiscal_sponsorship_approved_by" "uuid",
    "fiscal_sponsorship_note" "text",
    "donation_page_message" "text",
    "donation_page_image_path" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."slug" IS 'Public URL slug for /donate/[slug]; write-once after first set';



COMMENT ON COLUMN "public"."profiles"."fiscal_sponsorship_status" IS 'Eligibility for artist donation pages and recipient donations';



COMMENT ON COLUMN "public"."profiles"."fiscal_sponsorship_approved_at" IS 'Latest approval timestamp when status was set to approved';



COMMENT ON COLUMN "public"."profiles"."fiscal_sponsorship_approved_by" IS 'Latest admin approver for approved status';



COMMENT ON COLUMN "public"."profiles"."fiscal_sponsorship_note" IS 'Admin note for fiscal sponsorship status changes';



COMMENT ON COLUMN "public"."profiles"."donation_page_message" IS 'Optional copy shown on /donate/[slug]; null uses default page copy only';



COMMENT ON COLUMN "public"."profiles"."donation_page_image_path" IS 'Object path in donation-page-photos bucket; null means no hero image';



CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "decision" "text" NOT NULL,
    "notes" "text",
    "reviewer_user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "reviews_decision_check" CHECK (("decision" = ANY (ARRAY['APPROVED'::"text", 'REJECTED'::"text"])))
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


COMMENT ON TABLE "public"."reviews" IS 'Audit trail of admin review decisions for listings';



CREATE TABLE IF NOT EXISTS "public"."saved_listings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "attendance_status" "text",
    "saved_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "saved_listings_attendance_status_check" CHECK (("attendance_status" = ANY (ARRAY['attended'::"text", 'missed'::"text"])))
);


ALTER TABLE "public"."saved_listings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stripe_webhook_events" (
    "id" "text" NOT NULL,
    "type" "text" NOT NULL,
    "listing_id" "uuid",
    "stripe_created" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "donation_id" "uuid"
);


ALTER TABLE "public"."stripe_webhook_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."stripe_webhook_events" IS 'Tracks processed Stripe webhook events for idempotency. Event IDs are unique and prevent duplicate processing.';



COMMENT ON COLUMN "public"."stripe_webhook_events"."id" IS 'Stripe event ID (primary key for idempotency)';



COMMENT ON COLUMN "public"."stripe_webhook_events"."type" IS 'Stripe event type (e.g., checkout.session.completed)';



COMMENT ON COLUMN "public"."stripe_webhook_events"."listing_id" IS 'Associated listing ID if applicable (nullable - set when available, may be null if listing cannot be determined)';



COMMENT ON COLUMN "public"."stripe_webhook_events"."stripe_created" IS 'Stripe event created timestamp (for audit/debugging)';



COMMENT ON COLUMN "public"."stripe_webhook_events"."donation_id" IS 'Associated donation ID if applicable (nullable - set when available, may be null if donation cannot be determined)';



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audition_details"
    ADD CONSTRAINT "audition_details_listing_id_key" UNIQUE ("listing_id");



ALTER TABLE ONLY "public"."audition_details"
    ADD CONSTRAINT "audition_details_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."class_workshop_details"
    ADD CONSTRAINT "class_workshop_details_listing_id_key" UNIQUE ("listing_id");



ALTER TABLE ONLY "public"."class_workshop_details"
    ADD CONSTRAINT "class_workshop_details_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."creative_details"
    ADD CONSTRAINT "creative_details_listing_id_key" UNIQUE ("listing_id");



ALTER TABLE ONLY "public"."creative_details"
    ADD CONSTRAINT "creative_details_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."donations"
    ADD CONSTRAINT "donations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."emerging_eligibility_submissions"
    ADD CONSTRAINT "emerging_eligibility_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."listing_merges"
    ADD CONSTRAINT "listing_merges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."listing_occurrences"
    ADD CONSTRAINT "listing_occurrences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."listing_photos"
    ADD CONSTRAINT "listing_photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."listing_relationships"
    ADD CONSTRAINT "listing_relationships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."listing_relationships"
    ADD CONSTRAINT "listing_relationships_unique" UNIQUE ("parent_listing_id", "child_listing_id", "relationship_type");



ALTER TABLE ONLY "public"."listings"
    ADD CONSTRAINT "listings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."performance_details"
    ADD CONSTRAINT "performance_details_listing_id_key" UNIQUE ("listing_id");



ALTER TABLE ONLY "public"."performance_details"
    ADD CONSTRAINT "performance_details_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."piece_details"
    ADD CONSTRAINT "piece_details_listing_id_key" UNIQUE ("listing_id");



ALTER TABLE ONLY "public"."piece_details"
    ADD CONSTRAINT "piece_details_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey1" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_listings"
    ADD CONSTRAINT "saved_listings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_listings"
    ADD CONSTRAINT "saved_listings_user_listing_unique" UNIQUE ("user_id", "listing_id");



ALTER TABLE ONLY "public"."stripe_webhook_events"
    ADD CONSTRAINT "stripe_webhook_events_pkey" PRIMARY KEY ("id");



CREATE INDEX "announcements_archived_null_idx" ON "public"."announcements" USING "btree" ("id") WHERE ("archived_at" IS NULL);



CREATE INDEX "announcements_published_idx" ON "public"."announcements" USING "btree" ("published_at") WHERE ("published_at" IS NOT NULL);



CREATE INDEX "emerging_eligibility_submissions_decision_idx" ON "public"."emerging_eligibility_submissions" USING "btree" ("decision");



CREATE INDEX "emerging_eligibility_submissions_profile_time_idx" ON "public"."emerging_eligibility_submissions" USING "btree" ("profile_id", "submitted_at" DESC);



CREATE INDEX "emerging_eligibility_submissions_reviewed_at_idx" ON "public"."emerging_eligibility_submissions" USING "btree" ("reviewed_at");



CREATE INDEX "idx_announcements_archived" ON "public"."announcements" USING "btree" ("archived_at");



CREATE INDEX "idx_announcements_published" ON "public"."announcements" USING "btree" ("published_at");



CREATE INDEX "idx_audition_details_listing_id" ON "public"."audition_details" USING "btree" ("listing_id");



CREATE INDEX "idx_class_workshop_details_listing_id" ON "public"."class_workshop_details" USING "btree" ("listing_id");



CREATE INDEX "idx_class_workshop_details_parent_listing_id" ON "public"."class_workshop_details" USING "btree" ("parent_listing_id");



CREATE INDEX "idx_class_workshop_details_type" ON "public"."class_workshop_details" USING "btree" ("class_workshop_type");



CREATE INDEX "idx_creative_details_listing_id" ON "public"."creative_details" USING "btree" ("listing_id");



CREATE INDEX "idx_donations_created_at" ON "public"."donations" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_donations_donor_id" ON "public"."donations" USING "btree" ("donor_id") WHERE ("donor_id" IS NOT NULL);



CREATE INDEX "idx_donations_payment_status" ON "public"."donations" USING "btree" ("payment_status");



CREATE INDEX "idx_donations_recipient_user_id" ON "public"."donations" USING "btree" ("recipient_user_id") WHERE ("recipient_user_id" IS NOT NULL);



CREATE INDEX "idx_donations_recipient_user_payment_status" ON "public"."donations" USING "btree" ("recipient_user_id", "payment_status") WHERE ("recipient_user_id" IS NOT NULL);



CREATE INDEX "idx_donations_stripe_charge_id" ON "public"."donations" USING "btree" ("stripe_charge_id") WHERE ("stripe_charge_id" IS NOT NULL);



CREATE UNIQUE INDEX "idx_donations_stripe_checkout_session_id_unique" ON "public"."donations" USING "btree" ("stripe_checkout_session_id") WHERE ("stripe_checkout_session_id" IS NOT NULL);



CREATE INDEX "idx_donations_stripe_payment_intent_id" ON "public"."donations" USING "btree" ("stripe_payment_intent_id") WHERE ("stripe_payment_intent_id" IS NOT NULL);



CREATE INDEX "idx_listing_merges_merged_by" ON "public"."listing_merges" USING "btree" ("merged_by");



CREATE INDEX "idx_listing_merges_source" ON "public"."listing_merges" USING "btree" ("source_listing_id");



CREATE INDEX "idx_listing_merges_target" ON "public"."listing_merges" USING "btree" ("target_listing_id");



CREATE INDEX "idx_listing_occurrences_listing_id" ON "public"."listing_occurrences" USING "btree" ("listing_id");



CREATE INDEX "idx_listing_occurrences_listing_starts" ON "public"."listing_occurrences" USING "btree" ("listing_id", "starts_at_utc");



CREATE INDEX "idx_listing_occurrences_source_class" ON "public"."listing_occurrences" USING "btree" ("source_class_listing_id");



CREATE INDEX "idx_listing_occurrences_source_piece" ON "public"."listing_occurrences" USING "btree" ("source_piece_listing_id") WHERE ("source_piece_listing_id" IS NOT NULL);



CREATE INDEX "idx_listing_occurrences_starts_at" ON "public"."listing_occurrences" USING "btree" ("starts_at_utc");



CREATE INDEX "idx_listing_occurrences_type" ON "public"."listing_occurrences" USING "btree" ("occurrence_type");



CREATE INDEX "idx_listing_photos_listing_id" ON "public"."listing_photos" USING "btree" ("listing_id");



CREATE INDEX "idx_listing_photos_listing_sort" ON "public"."listing_photos" USING "btree" ("listing_id", "sort_order");



CREATE INDEX "idx_listing_relationships_child" ON "public"."listing_relationships" USING "btree" ("child_listing_id");



CREATE INDEX "idx_listing_relationships_parent" ON "public"."listing_relationships" USING "btree" ("parent_listing_id");



CREATE INDEX "idx_listing_relationships_type" ON "public"."listing_relationships" USING "btree" ("relationship_type");



CREATE INDEX "idx_listings_created_at" ON "public"."listings" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_listings_created_by" ON "public"."listings" USING "btree" ("created_by");



CREATE INDEX "idx_listings_deleted_at" ON "public"."listings" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_listings_payment_required" ON "public"."listings" USING "btree" ("payment_required") WHERE ("payment_required" = true);



CREATE INDEX "idx_listings_payment_status" ON "public"."listings" USING "btree" ("payment_status");



CREATE INDEX "idx_listings_status" ON "public"."listings" USING "btree" ("status");



CREATE INDEX "idx_listings_stripe_charge_id" ON "public"."listings" USING "btree" ("stripe_charge_id") WHERE ("stripe_charge_id" IS NOT NULL);



CREATE INDEX "idx_listings_stripe_payment_intent_id" ON "public"."listings" USING "btree" ("stripe_payment_intent_id") WHERE ("stripe_payment_intent_id" IS NOT NULL);



CREATE INDEX "idx_listings_type" ON "public"."listings" USING "btree" ("type");



CREATE INDEX "idx_listings_type_status_deleted" ON "public"."listings" USING "btree" ("type", "status", "deleted_at") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_performance_details_listing_id" ON "public"."performance_details" USING "btree" ("listing_id");



CREATE INDEX "idx_performance_details_subtype" ON "public"."performance_details" USING "btree" ("subtype");



CREATE INDEX "idx_piece_details_listing_id" ON "public"."piece_details" USING "btree" ("listing_id");



CREATE INDEX "idx_piece_details_parent_listing_id" ON "public"."piece_details" USING "btree" ("parent_listing_id");



CREATE INDEX "idx_profiles_fiscal_sponsorship_status" ON "public"."profiles" USING "btree" ("fiscal_sponsorship_status");



CREATE INDEX "idx_reviews_created_at" ON "public"."reviews" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_reviews_listing_id" ON "public"."reviews" USING "btree" ("listing_id");



CREATE INDEX "idx_reviews_reviewer_user_id" ON "public"."reviews" USING "btree" ("reviewer_user_id");



CREATE INDEX "idx_saved_listings_listing_id" ON "public"."saved_listings" USING "btree" ("listing_id");



CREATE INDEX "idx_saved_listings_user_id" ON "public"."saved_listings" USING "btree" ("user_id");



CREATE INDEX "idx_saved_listings_user_saved_at" ON "public"."saved_listings" USING "btree" ("user_id", "saved_at" DESC);



CREATE INDEX "idx_stripe_webhook_events_created_at" ON "public"."stripe_webhook_events" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_stripe_webhook_events_donation_id" ON "public"."stripe_webhook_events" USING "btree" ("donation_id") WHERE ("donation_id" IS NOT NULL);



CREATE INDEX "idx_stripe_webhook_events_listing_id" ON "public"."stripe_webhook_events" USING "btree" ("listing_id") WHERE ("listing_id" IS NOT NULL);



CREATE INDEX "idx_stripe_webhook_events_type" ON "public"."stripe_webhook_events" USING "btree" ("type");



CREATE INDEX "profiles_artist_status_idx" ON "public"."profiles" USING "btree" ("artist_status");



CREATE INDEX "profiles_profile_type_idx" ON "public"."profiles" USING "btree" ("profile_type");



CREATE INDEX "profiles_referral_source_idx" ON "public"."profiles" USING "btree" ("referral_source");



CREATE INDEX "profiles_role_idx" ON "public"."profiles" USING "btree" ("role");



CREATE UNIQUE INDEX "profiles_slug_unique" ON "public"."profiles" USING "btree" ("slug") WHERE ("slug" IS NOT NULL);



CREATE OR REPLACE TRIGGER "set_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_announcements_updated_at" BEFORE UPDATE ON "public"."announcements" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_clear_resubmission_required_at" AFTER INSERT ON "public"."emerging_eligibility_submissions" FOR EACH ROW EXECUTE FUNCTION "public"."clear_resubmission_required_at"();



CREATE OR REPLACE TRIGGER "trg_eligibility_rate_limit" BEFORE INSERT ON "public"."emerging_eligibility_submissions" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_eligibility_submission_rate_limit"();



CREATE OR REPLACE TRIGGER "update_audition_details_updated_at" BEFORE UPDATE ON "public"."audition_details" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_class_workshop_details_updated_at" BEFORE UPDATE ON "public"."class_workshop_details" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_creative_details_updated_at" BEFORE UPDATE ON "public"."creative_details" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_listings_updated_at" BEFORE UPDATE ON "public"."listings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_performance_details_updated_at" BEFORE UPDATE ON "public"."performance_details" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_piece_details_updated_at" BEFORE UPDATE ON "public"."piece_details" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."audition_details"
    ADD CONSTRAINT "audition_details_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."class_workshop_details"
    ADD CONSTRAINT "class_workshop_details_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."class_workshop_details"
    ADD CONSTRAINT "class_workshop_details_parent_listing_id_fkey" FOREIGN KEY ("parent_listing_id") REFERENCES "public"."listings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."creative_details"
    ADD CONSTRAINT "creative_details_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."donations"
    ADD CONSTRAINT "donations_donor_id_fkey" FOREIGN KEY ("donor_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."donations"
    ADD CONSTRAINT "donations_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."emerging_eligibility_submissions"
    ADD CONSTRAINT "emerging_eligibility_submissions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."emerging_eligibility_submissions"
    ADD CONSTRAINT "emerging_eligibility_submissions_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."listing_merges"
    ADD CONSTRAINT "listing_merges_merged_by_fkey" FOREIGN KEY ("merged_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."listing_merges"
    ADD CONSTRAINT "listing_merges_source_listing_id_fkey" FOREIGN KEY ("source_listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listing_merges"
    ADD CONSTRAINT "listing_merges_target_listing_id_fkey" FOREIGN KEY ("target_listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listing_occurrences"
    ADD CONSTRAINT "listing_occurrences_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listing_occurrences"
    ADD CONSTRAINT "listing_occurrences_source_class_listing_id_fkey" FOREIGN KEY ("source_class_listing_id") REFERENCES "public"."listings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."listing_occurrences"
    ADD CONSTRAINT "listing_occurrences_source_piece_listing_id_fkey" FOREIGN KEY ("source_piece_listing_id") REFERENCES "public"."listings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."listing_photos"
    ADD CONSTRAINT "listing_photos_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listing_relationships"
    ADD CONSTRAINT "listing_relationships_child_listing_id_fkey" FOREIGN KEY ("child_listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listing_relationships"
    ADD CONSTRAINT "listing_relationships_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."listing_relationships"
    ADD CONSTRAINT "listing_relationships_parent_listing_id_fkey" FOREIGN KEY ("parent_listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listings"
    ADD CONSTRAINT "listings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."listings"
    ADD CONSTRAINT "listings_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."performance_details"
    ADD CONSTRAINT "performance_details_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."piece_details"
    ADD CONSTRAINT "piece_details_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."piece_details"
    ADD CONSTRAINT "piece_details_parent_listing_id_fkey" FOREIGN KEY ("parent_listing_id") REFERENCES "public"."listings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_artist_status_reviewed_by_fkey" FOREIGN KEY ("artist_status_reviewed_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_fiscal_sponsorship_approved_by_fkey" FOREIGN KEY ("fiscal_sponsorship_approved_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_reviewer_user_id_fkey" FOREIGN KEY ("reviewer_user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."saved_listings"
    ADD CONSTRAINT "saved_listings_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_listings"
    ADD CONSTRAINT "saved_listings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stripe_webhook_events"
    ADD CONSTRAINT "stripe_webhook_events_donation_id_fkey" FOREIGN KEY ("donation_id") REFERENCES "public"."donations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."stripe_webhook_events"
    ADD CONSTRAINT "stripe_webhook_events_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE SET NULL;



CREATE POLICY "Admins can create reviews" ON "public"."reviews" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can delete eligibility submissions" ON "public"."emerging_eligibility_submissions" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admins can insert occurrences for parent events from pieces" ON "public"."listing_occurrences" FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))) AND (EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "listing_occurrences"."listing_id") AND ("l"."status" = 'approved'::"public"."listing_status") AND ("l"."deleted_at" IS NULL)))) AND (("source_piece_listing_id" IS NOT NULL) OR (EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "listing_occurrences"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = 'pending'::"public"."listing_status")))))));



CREATE POLICY "Admins can insert occurrences for parent workshops from classes" ON "public"."listing_occurrences" FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))) AND ("source_class_listing_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM ("public"."class_workshop_details" "cwd"
     JOIN "public"."listings" "child" ON (("cwd"."listing_id" = "child"."id")))
  WHERE (("cwd"."listing_id" = "listing_occurrences"."source_class_listing_id") AND ("cwd"."parent_listing_id" = "listing_occurrences"."listing_id") AND ("child"."deleted_at" IS NULL))))));



CREATE POLICY "Admins can insert profiles" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can read all eligibility submissions" ON "public"."emerging_eligibility_submissions" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admins can read all profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admins can read all reviews" ON "public"."reviews" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Admins can update all profiles" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can update eligibility submissions" ON "public"."emerging_eligibility_submissions" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins have full access to listings" ON "public"."listings" USING ("public"."is_admin"());



CREATE POLICY "Admins have full access to relationships" ON "public"."listing_relationships" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Users can create relationships for their listings" ON "public"."listing_relationships" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("created_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."listings"
  WHERE (("listings"."id" = "listing_relationships"."child_listing_id") AND ("listings"."created_by" = "auth"."uid"())))) AND (EXISTS ( SELECT 1
   FROM "public"."listings"
  WHERE (("listings"."id" = "listing_relationships"."parent_listing_id") AND ((("listings"."status" = 'approved'::"public"."listing_status") AND ("listings"."deleted_at" IS NULL)) OR ("listings"."created_by" = "auth"."uid"())))))));



CREATE POLICY "Users can create their own listings" ON "public"."listings" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("created_by" IS NOT NULL) AND ("auth"."uid"() = "created_by")));



CREATE POLICY "Users can delete audition_details" ON "public"."audition_details" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "audition_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = 'pending'::"public"."listing_status")))));



CREATE POLICY "Users can delete class_workshop_details" ON "public"."class_workshop_details" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "class_workshop_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = 'pending'::"public"."listing_status")))));



CREATE POLICY "Users can delete creative_details" ON "public"."creative_details" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "creative_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = 'pending'::"public"."listing_status")))));



CREATE POLICY "Users can delete listing_occurrences" ON "public"."listing_occurrences" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "listing_occurrences"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = 'pending'::"public"."listing_status")))));



CREATE POLICY "Users can delete listing_photos" ON "public"."listing_photos" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "listing_photos"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = 'pending'::"public"."listing_status")))));



CREATE POLICY "Users can delete performance_details" ON "public"."performance_details" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "performance_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = 'pending'::"public"."listing_status")))));



CREATE POLICY "Users can delete piece_details" ON "public"."piece_details" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "piece_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = 'pending'::"public"."listing_status")))));



CREATE POLICY "Users can delete their own saved listings" ON "public"."saved_listings" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert audition_details" ON "public"."audition_details" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "audition_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = 'pending'::"public"."listing_status")))));



CREATE POLICY "Users can insert class_workshop_details" ON "public"."class_workshop_details" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "class_workshop_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = 'pending'::"public"."listing_status")))));



CREATE POLICY "Users can insert creative_details" ON "public"."creative_details" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "creative_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = 'pending'::"public"."listing_status")))));



CREATE POLICY "Users can insert listing_occurrences" ON "public"."listing_occurrences" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "listing_occurrences"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = 'pending'::"public"."listing_status")))));



CREATE POLICY "Users can insert listing_photos" ON "public"."listing_photos" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "listing_photos"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = 'pending'::"public"."listing_status")))));



CREATE POLICY "Users can insert performance_details" ON "public"."performance_details" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "performance_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = 'pending'::"public"."listing_status")))));



CREATE POLICY "Users can insert piece_details" ON "public"."piece_details" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "piece_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = 'pending'::"public"."listing_status")))));



CREATE POLICY "Users can insert their own eligibility submissions" ON "public"."emerging_eligibility_submissions" FOR INSERT TO "authenticated" WITH CHECK (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own saved listings" ON "public"."saved_listings" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read approved listings" ON "public"."listings" FOR SELECT TO "authenticated", "anon" USING (((("status" = 'approved'::"public"."listing_status") AND ("deleted_at" IS NULL)) OR (("created_by" = "auth"."uid"()) AND ("deleted_at" IS NULL))));



CREATE POLICY "Users can read audition_details" ON "public"."audition_details" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "audition_details"."listing_id") AND (("l"."status" = 'approved'::"public"."listing_status") OR ("l"."created_by" = "auth"."uid"())) AND ("l"."deleted_at" IS NULL)))));



CREATE POLICY "Users can read class_workshop_details" ON "public"."class_workshop_details" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "class_workshop_details"."listing_id") AND (("l"."status" = 'approved'::"public"."listing_status") OR ("l"."created_by" = "auth"."uid"())) AND ("l"."deleted_at" IS NULL)))));



CREATE POLICY "Users can read creative_details" ON "public"."creative_details" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "creative_details"."listing_id") AND (("l"."status" = 'approved'::"public"."listing_status") OR ("l"."created_by" = "auth"."uid"())) AND ("l"."deleted_at" IS NULL)))));



CREATE POLICY "Users can read listing_occurrences" ON "public"."listing_occurrences" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "listing_occurrences"."listing_id") AND (("l"."status" = 'approved'::"public"."listing_status") OR ("l"."created_by" = "auth"."uid"())) AND ("l"."deleted_at" IS NULL)))));



CREATE POLICY "Users can read listing_photos" ON "public"."listing_photos" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "listing_photos"."listing_id") AND (("l"."status" = 'approved'::"public"."listing_status") OR ("l"."created_by" = "auth"."uid"())) AND ("l"."deleted_at" IS NULL)))));



CREATE POLICY "Users can read performance_details" ON "public"."performance_details" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "performance_details"."listing_id") AND (("l"."status" = 'approved'::"public"."listing_status") OR ("l"."created_by" = "auth"."uid"())) AND ("l"."deleted_at" IS NULL)))));



CREATE POLICY "Users can read piece_details" ON "public"."piece_details" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "piece_details"."listing_id") AND (("l"."status" = 'approved'::"public"."listing_status") OR ("l"."created_by" = "auth"."uid"())) AND ("l"."deleted_at" IS NULL)))));



CREATE POLICY "Users can read relationships" ON "public"."listing_relationships" FOR SELECT TO "authenticated", "anon" USING (((EXISTS ( SELECT 1
   FROM "public"."listings"
  WHERE (("listings"."id" = "listing_relationships"."parent_listing_id") AND (("listings"."status" = 'approved'::"public"."listing_status") AND ("listings"."deleted_at" IS NULL))))) OR (EXISTS ( SELECT 1
   FROM "public"."listings"
  WHERE (("listings"."id" = "listing_relationships"."child_listing_id") AND ((("listings"."status" = 'approved'::"public"."listing_status") AND ("listings"."deleted_at" IS NULL)) OR ("listings"."created_by" = "auth"."uid"())))))));



CREATE POLICY "Users can read their own eligibility submissions" ON "public"."emerging_eligibility_submissions" FOR SELECT TO "authenticated" USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can read their own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "Users can update audition_details" ON "public"."audition_details" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "audition_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = 'pending'::"public"."listing_status"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "audition_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = 'pending'::"public"."listing_status")))));



CREATE POLICY "Users can update class_workshop_details" ON "public"."class_workshop_details" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "class_workshop_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = 'pending'::"public"."listing_status"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "class_workshop_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = 'pending'::"public"."listing_status")))));



CREATE POLICY "Users can update creative_details" ON "public"."creative_details" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "creative_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = 'pending'::"public"."listing_status"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "creative_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = 'pending'::"public"."listing_status")))));



CREATE POLICY "Users can update listing_occurrences" ON "public"."listing_occurrences" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "listing_occurrences"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = 'pending'::"public"."listing_status"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "listing_occurrences"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = 'pending'::"public"."listing_status")))));



CREATE POLICY "Users can update listing_photos" ON "public"."listing_photos" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "listing_photos"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = 'pending'::"public"."listing_status"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "listing_photos"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = 'pending'::"public"."listing_status")))));



CREATE POLICY "Users can update performance_details" ON "public"."performance_details" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "performance_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = 'pending'::"public"."listing_status"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "performance_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = 'pending'::"public"."listing_status")))));



CREATE POLICY "Users can update piece_details" ON "public"."piece_details" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "piece_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = 'pending'::"public"."listing_status"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "piece_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = 'pending'::"public"."listing_status")))));



CREATE POLICY "Users can update their own listings" ON "public"."listings" FOR UPDATE TO "authenticated" USING ((("created_by" = "auth"."uid"()) AND ("status" = 'pending'::"public"."listing_status"))) WITH CHECK ((("created_by" = "auth"."uid"()) AND ("status" = 'pending'::"public"."listing_status")));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK ((("id" = "auth"."uid"()) AND ("role" = ( SELECT "profiles_1"."role"
   FROM "public"."profiles" "profiles_1"
  WHERE ("profiles_1"."id" = "auth"."uid"()))) AND ("artist_status" = ( SELECT "profiles_1"."artist_status"
   FROM "public"."profiles" "profiles_1"
  WHERE ("profiles_1"."id" = "auth"."uid"()))) AND (NOT ("artist_status_reviewed_at" IS DISTINCT FROM ( SELECT "profiles_1"."artist_status_reviewed_at"
   FROM "public"."profiles" "profiles_1"
  WHERE ("profiles_1"."id" = "auth"."uid"())))) AND (NOT ("artist_status_reviewed_by" IS DISTINCT FROM ( SELECT "profiles_1"."artist_status_reviewed_by"
   FROM "public"."profiles" "profiles_1"
  WHERE ("profiles_1"."id" = "auth"."uid"()))))));



CREATE POLICY "Users can update their own saved listings" ON "public"."saved_listings" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own saved listings" ON "public"."saved_listings" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."announcements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "announcements_delete_admin" ON "public"."announcements" FOR DELETE TO "authenticated" USING (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "announcements_insert_admin" ON "public"."announcements" FOR INSERT TO "authenticated" WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "announcements_select" ON "public"."announcements" FOR SELECT TO "authenticated", "anon" USING (((("published_at" IS NOT NULL) AND ("archived_at" IS NULL)) OR ((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text") AND ( SELECT "public"."is_admin"() AS "is_admin"))));



CREATE POLICY "announcements_update_admin" ON "public"."announcements" FOR UPDATE TO "authenticated" USING (( SELECT "public"."is_admin"() AS "is_admin")) WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



ALTER TABLE "public"."audition_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."class_workshop_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."creative_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."donations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "donations_insert_anon" ON "public"."donations" FOR INSERT TO "anon" WITH CHECK ((("donor_id" IS NULL) AND ("payment_status" = 'requires_payment'::"public"."payment_status") AND ("stripe_checkout_session_id" IS NULL) AND ("stripe_payment_intent_id" IS NULL) AND ("stripe_charge_id" IS NULL) AND ("internal_notification_sent_at" IS NULL) AND ("donor_receipt_sent_at" IS NULL) AND ("currency" = 'usd'::"text") AND ("amount" >= 100) AND ("base_gift_cents" >= 100) AND ("base_gift_cents" <= 10000000)));



CREATE POLICY "donations_insert_authenticated" ON "public"."donations" FOR INSERT TO "authenticated" WITH CHECK ((("donor_id" = "auth"."uid"()) AND ("payment_status" = 'requires_payment'::"public"."payment_status") AND ("stripe_checkout_session_id" IS NULL) AND ("stripe_payment_intent_id" IS NULL) AND ("stripe_charge_id" IS NULL) AND ("internal_notification_sent_at" IS NULL) AND ("donor_receipt_sent_at" IS NULL) AND ("currency" = 'usd'::"text") AND ("amount" >= 100) AND ("base_gift_cents" >= 100) AND ("base_gift_cents" <= 10000000)));



CREATE POLICY "donations_select_authenticated" ON "public"."donations" FOR SELECT TO "authenticated" USING ((("donor_id" = "auth"."uid"()) OR ("recipient_user_id" = "auth"."uid"()) OR "public"."is_admin"()));



ALTER TABLE "public"."emerging_eligibility_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."listing_merges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."listing_occurrences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."listing_photos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."listing_relationships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."listings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."performance_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."piece_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_select_public_slug" ON "public"."profiles" FOR SELECT USING (("slug" IS NOT NULL));



ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."saved_listings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stripe_webhook_events" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
























































































































































































































































































































GRANT ALL ON FUNCTION "public"."add_listing_child"("p_parent_listing_id" "uuid", "p_child_listing_id" "uuid", "p_relationship_type" "text", "p_created_by" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."add_listing_child"("p_parent_listing_id" "uuid", "p_child_listing_id" "uuid", "p_relationship_type" "text", "p_created_by" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_listing_child"("p_parent_listing_id" "uuid", "p_child_listing_id" "uuid", "p_relationship_type" "text", "p_created_by" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."cancel_stale_donations"() TO "anon";
GRANT ALL ON FUNCTION "public"."cancel_stale_donations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_stale_donations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."clear_resubmission_required_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."clear_resubmission_required_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."clear_resubmission_required_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."debug_whoami"() TO "anon";
GRANT ALL ON FUNCTION "public"."debug_whoami"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."debug_whoami"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_eligibility_submission_rate_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_eligibility_submission_rate_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_eligibility_submission_rate_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_listing_full"("p_listing_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_listing_full"("p_listing_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_listing_full"("p_listing_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_listing_hierarchy"("p_listing_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_listing_hierarchy"("p_listing_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_listing_hierarchy"("p_listing_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";



GRANT ALL ON FUNCTION "public"."merge_listings"("p_source_listing_id" "uuid", "p_target_listing_id" "uuid", "p_merged_by" "uuid", "p_merge_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."merge_listings"("p_source_listing_id" "uuid", "p_target_listing_id" "uuid", "p_merged_by" "uuid", "p_merge_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."merge_listings"("p_source_listing_id" "uuid", "p_target_listing_id" "uuid", "p_merged_by" "uuid", "p_merge_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."remove_listing_child"("p_parent_listing_id" "uuid", "p_child_listing_id" "uuid", "p_relationship_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."remove_listing_child"("p_parent_listing_id" "uuid", "p_child_listing_id" "uuid", "p_relationship_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_listing_child"("p_parent_listing_id" "uuid", "p_child_listing_id" "uuid", "p_relationship_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."test_listings_insert_policy"("test_created_by" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."test_listings_insert_policy"("test_created_by" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."test_listings_insert_policy"("test_created_by" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";






























GRANT ALL ON TABLE "public"."announcements" TO "anon";
GRANT ALL ON TABLE "public"."announcements" TO "authenticated";
GRANT ALL ON TABLE "public"."announcements" TO "service_role";



GRANT ALL ON TABLE "public"."audition_details" TO "anon";
GRANT ALL ON TABLE "public"."audition_details" TO "authenticated";
GRANT ALL ON TABLE "public"."audition_details" TO "service_role";



GRANT ALL ON TABLE "public"."class_workshop_details" TO "anon";
GRANT ALL ON TABLE "public"."class_workshop_details" TO "authenticated";
GRANT ALL ON TABLE "public"."class_workshop_details" TO "service_role";



GRANT ALL ON TABLE "public"."creative_details" TO "anon";
GRANT ALL ON TABLE "public"."creative_details" TO "authenticated";
GRANT ALL ON TABLE "public"."creative_details" TO "service_role";



GRANT ALL ON TABLE "public"."donations" TO "anon";
GRANT ALL ON TABLE "public"."donations" TO "authenticated";
GRANT ALL ON TABLE "public"."donations" TO "service_role";



GRANT ALL ON TABLE "public"."emerging_eligibility_submissions" TO "anon";
GRANT ALL ON TABLE "public"."emerging_eligibility_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."emerging_eligibility_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."listing_merges" TO "anon";
GRANT ALL ON TABLE "public"."listing_merges" TO "authenticated";
GRANT ALL ON TABLE "public"."listing_merges" TO "service_role";



GRANT ALL ON TABLE "public"."listing_occurrences" TO "anon";
GRANT ALL ON TABLE "public"."listing_occurrences" TO "authenticated";
GRANT ALL ON TABLE "public"."listing_occurrences" TO "service_role";



GRANT ALL ON TABLE "public"."listing_photos" TO "anon";
GRANT ALL ON TABLE "public"."listing_photos" TO "authenticated";
GRANT ALL ON TABLE "public"."listing_photos" TO "service_role";



GRANT ALL ON TABLE "public"."listing_relationships" TO "anon";
GRANT ALL ON TABLE "public"."listing_relationships" TO "authenticated";
GRANT ALL ON TABLE "public"."listing_relationships" TO "service_role";



GRANT ALL ON TABLE "public"."listings" TO "anon";
GRANT ALL ON TABLE "public"."listings" TO "authenticated";
GRANT ALL ON TABLE "public"."listings" TO "service_role";



GRANT ALL ON TABLE "public"."performance_details" TO "anon";
GRANT ALL ON TABLE "public"."performance_details" TO "authenticated";
GRANT ALL ON TABLE "public"."performance_details" TO "service_role";



GRANT ALL ON TABLE "public"."piece_details" TO "anon";
GRANT ALL ON TABLE "public"."piece_details" TO "authenticated";
GRANT ALL ON TABLE "public"."piece_details" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."saved_listings" TO "anon";
GRANT ALL ON TABLE "public"."saved_listings" TO "authenticated";
GRANT ALL ON TABLE "public"."saved_listings" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_webhook_events" TO "anon";
GRANT ALL ON TABLE "public"."stripe_webhook_events" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_webhook_events" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

create extension if not exists "pg_net" with schema "public";

drop policy "announcements_select" on "public"."announcements";


  create policy "announcements_select"
  on "public"."announcements"
  as permissive
  for select
  to anon, authenticated
using ((((published_at IS NOT NULL) AND (archived_at IS NULL)) OR ((( SELECT auth.role() AS role) = 'authenticated'::text) AND ( SELECT public.is_admin() AS is_admin))));


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Authenticated read 1rdror8_0"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'event-photos'::text));



  create policy "Authenticated upload 1rdror8_0"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'event-photos'::text));



  create policy "Public read 1bbg402_0"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'event-photos-public'::text));



  create policy "Service role full access 1bbg402_0"
  on "storage"."objects"
  as permissive
  for select
  to service_role
using ((bucket_id = 'event-photos-public'::text));



  create policy "Service role full access 1bbg402_1"
  on "storage"."objects"
  as permissive
  for insert
  to service_role
with check ((bucket_id = 'event-photos-public'::text));



  create policy "Service role full access 1bbg402_2"
  on "storage"."objects"
  as permissive
  for update
  to service_role
using ((bucket_id = 'event-photos-public'::text));



  create policy "Service role full access 1bbg402_3"
  on "storage"."objects"
  as permissive
  for delete
  to service_role
using ((bucket_id = 'event-photos-public'::text));



  create policy "Service role full access 1rdror8_0"
  on "storage"."objects"
  as permissive
  for select
  to service_role
using ((bucket_id = 'event-photos'::text));



  create policy "Service role full access 1rdror8_1"
  on "storage"."objects"
  as permissive
  for insert
  to service_role
with check ((bucket_id = 'event-photos'::text));



  create policy "Service role full access 1rdror8_2"
  on "storage"."objects"
  as permissive
  for update
  to service_role
using ((bucket_id = 'event-photos'::text));



  create policy "Service role full access 1rdror8_3"
  on "storage"."objects"
  as permissive
  for delete
  to service_role
using ((bucket_id = 'event-photos'::text));



