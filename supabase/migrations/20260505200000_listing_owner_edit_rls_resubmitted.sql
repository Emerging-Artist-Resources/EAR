-- Owner listing edits: child-table RLS for pending_payment, listings transitions
-- (approved/rejected → pending), resubmitted_at audit, user delete on listing_relationships.

ALTER TABLE "public"."listings"
  ADD COLUMN IF NOT EXISTS "resubmitted_at" timestamp with time zone;

COMMENT ON COLUMN "public"."listings"."resubmitted_at" IS 'Set when owner resubmits an approved or rejected listing for review (status returns to pending).';

-- ---------------------------------------------------------------------------
-- Child tables: allow owner mutations when parent is pending OR pending_payment
-- (Replaces policies that only allowed parent status = pending.)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can delete audition_details" ON "public"."audition_details";
CREATE POLICY "Users can delete audition_details" ON "public"."audition_details" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "audition_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = ANY (ARRAY['pending'::"public"."listing_status", 'pending_payment'::"public"."listing_status"]))))));

DROP POLICY IF EXISTS "Users can delete class_workshop_details" ON "public"."class_workshop_details";
CREATE POLICY "Users can delete class_workshop_details" ON "public"."class_workshop_details" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "class_workshop_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = ANY (ARRAY['pending'::"public"."listing_status", 'pending_payment'::"public"."listing_status"]))))));

DROP POLICY IF EXISTS "Users can delete creative_details" ON "public"."creative_details";
CREATE POLICY "Users can delete creative_details" ON "public"."creative_details" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "creative_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = ANY (ARRAY['pending'::"public"."listing_status", 'pending_payment'::"public"."listing_status"]))))));

DROP POLICY IF EXISTS "Users can delete listing_occurrences" ON "public"."listing_occurrences";
CREATE POLICY "Users can delete listing_occurrences" ON "public"."listing_occurrences" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "listing_occurrences"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = ANY (ARRAY['pending'::"public"."listing_status", 'pending_payment'::"public"."listing_status"]))))));

DROP POLICY IF EXISTS "Users can delete listing_photos" ON "public"."listing_photos";
CREATE POLICY "Users can delete listing_photos" ON "public"."listing_photos" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "listing_photos"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = ANY (ARRAY['pending'::"public"."listing_status", 'pending_payment'::"public"."listing_status"]))))));

DROP POLICY IF EXISTS "Users can delete performance_details" ON "public"."performance_details";
CREATE POLICY "Users can delete performance_details" ON "public"."performance_details" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "performance_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = ANY (ARRAY['pending'::"public"."listing_status", 'pending_payment'::"public"."listing_status"]))))));

DROP POLICY IF EXISTS "Users can delete piece_details" ON "public"."piece_details";
CREATE POLICY "Users can delete piece_details" ON "public"."piece_details" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "piece_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = ANY (ARRAY['pending'::"public"."listing_status", 'pending_payment'::"public"."listing_status"]))))));

DROP POLICY IF EXISTS "Users can insert audition_details" ON "public"."audition_details";
CREATE POLICY "Users can insert audition_details" ON "public"."audition_details" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "audition_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = ANY (ARRAY['pending'::"public"."listing_status", 'pending_payment'::"public"."listing_status"]))))));

DROP POLICY IF EXISTS "Users can insert class_workshop_details" ON "public"."class_workshop_details";
CREATE POLICY "Users can insert class_workshop_details" ON "public"."class_workshop_details" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "class_workshop_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = ANY (ARRAY['pending'::"public"."listing_status", 'pending_payment'::"public"."listing_status"]))))));

DROP POLICY IF EXISTS "Users can insert creative_details" ON "public"."creative_details";
CREATE POLICY "Users can insert creative_details" ON "public"."creative_details" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "creative_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = ANY (ARRAY['pending'::"public"."listing_status", 'pending_payment'::"public"."listing_status"]))))));

DROP POLICY IF EXISTS "Users can insert listing_occurrences" ON "public"."listing_occurrences";
CREATE POLICY "Users can insert listing_occurrences" ON "public"."listing_occurrences" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "listing_occurrences"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = ANY (ARRAY['pending'::"public"."listing_status", 'pending_payment'::"public"."listing_status"]))))));

DROP POLICY IF EXISTS "Users can insert listing_photos" ON "public"."listing_photos";
CREATE POLICY "Users can insert listing_photos" ON "public"."listing_photos" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "listing_photos"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = ANY (ARRAY['pending'::"public"."listing_status", 'pending_payment'::"public"."listing_status"]))))));

DROP POLICY IF EXISTS "Users can insert performance_details" ON "public"."performance_details";
CREATE POLICY "Users can insert performance_details" ON "public"."performance_details" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "performance_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = ANY (ARRAY['pending'::"public"."listing_status", 'pending_payment'::"public"."listing_status"]))))));

DROP POLICY IF EXISTS "Users can insert piece_details" ON "public"."piece_details";
CREATE POLICY "Users can insert piece_details" ON "public"."piece_details" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "piece_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = ANY (ARRAY['pending'::"public"."listing_status", 'pending_payment'::"public"."listing_status"]))))));

DROP POLICY IF EXISTS "Users can update audition_details" ON "public"."audition_details";
CREATE POLICY "Users can update audition_details" ON "public"."audition_details" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "audition_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = ANY (ARRAY['pending'::"public"."listing_status", 'pending_payment'::"public"."listing_status"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "audition_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = ANY (ARRAY['pending'::"public"."listing_status", 'pending_payment'::"public"."listing_status"]))))));

DROP POLICY IF EXISTS "Users can update class_workshop_details" ON "public"."class_workshop_details";
CREATE POLICY "Users can update class_workshop_details" ON "public"."class_workshop_details" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "class_workshop_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = ANY (ARRAY['pending'::"public"."listing_status", 'pending_payment'::"public"."listing_status"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "class_workshop_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = ANY (ARRAY['pending'::"public"."listing_status", 'pending_payment'::"public"."listing_status"]))))));

DROP POLICY IF EXISTS "Users can update creative_details" ON "public"."creative_details";
CREATE POLICY "Users can update creative_details" ON "public"."creative_details" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "creative_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = ANY (ARRAY['pending'::"public"."listing_status", 'pending_payment'::"public"."listing_status"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "creative_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = ANY (ARRAY['pending'::"public"."listing_status", 'pending_payment'::"public"."listing_status"]))))));

DROP POLICY IF EXISTS "Users can update listing_occurrences" ON "public"."listing_occurrences";
CREATE POLICY "Users can update listing_occurrences" ON "public"."listing_occurrences" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "listing_occurrences"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = ANY (ARRAY['pending'::"public"."listing_status", 'pending_payment'::"public"."listing_status"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "listing_occurrences"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = ANY (ARRAY['pending'::"public"."listing_status", 'pending_payment'::"public"."listing_status"]))))));

DROP POLICY IF EXISTS "Users can update listing_photos" ON "public"."listing_photos";
CREATE POLICY "Users can update listing_photos" ON "public"."listing_photos" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "listing_photos"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = ANY (ARRAY['pending'::"public"."listing_status", 'pending_payment'::"public"."listing_status"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "listing_photos"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = ANY (ARRAY['pending'::"public"."listing_status", 'pending_payment'::"public"."listing_status"]))))));

DROP POLICY IF EXISTS "Users can update performance_details" ON "public"."performance_details";
CREATE POLICY "Users can update performance_details" ON "public"."performance_details" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "performance_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = ANY (ARRAY['pending'::"public"."listing_status", 'pending_payment'::"public"."listing_status"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "performance_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = ANY (ARRAY['pending'::"public"."listing_status", 'pending_payment'::"public"."listing_status"]))))));

DROP POLICY IF EXISTS "Users can update piece_details" ON "public"."piece_details";
CREATE POLICY "Users can update piece_details" ON "public"."piece_details" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "piece_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = ANY (ARRAY['pending'::"public"."listing_status", 'pending_payment'::"public"."listing_status"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."listings" "l"
  WHERE (("l"."id" = "piece_details"."listing_id") AND ("l"."created_by" = "auth"."uid"()) AND ("l"."status" = ANY (ARRAY['pending'::"public"."listing_status", 'pending_payment'::"public"."listing_status"]))))));

-- ---------------------------------------------------------------------------
-- Listings: owner may update in-place (pending / pending_payment) or
-- transition approved / rejected → pending (WITH CHECK only allows pending states).
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can update their own listings" ON "public"."listings";

CREATE POLICY "Users can update their own listings" ON "public"."listings"
  FOR UPDATE TO "authenticated"
  USING (
    ("created_by" = "auth"."uid"())
    AND ("deleted_at" IS NULL)
    AND (
      "status" = ANY (
        ARRAY[
          'pending'::"public"."listing_status",
          'pending_payment'::"public"."listing_status",
          'approved'::"public"."listing_status",
          'rejected'::"public"."listing_status"
        ]
      )
    )
  )
  WITH CHECK (
    ("created_by" = "auth"."uid"())
    AND ("deleted_at" IS NULL)
    AND (
      "status" = ANY (
        ARRAY[
          'pending'::"public"."listing_status",
          'pending_payment'::"public"."listing_status"
        ]
      )
    )
  );

-- ---------------------------------------------------------------------------
-- listing_relationships: allow owner to delete edges involving their listing
-- (full replace on edit).
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can delete listing_relationships" ON "public"."listing_relationships";
CREATE POLICY "Users can delete listing_relationships" ON "public"."listing_relationships" FOR DELETE TO "authenticated" USING (
  (
    EXISTS (
      SELECT 1 FROM "public"."listings" "c"
      WHERE ("c"."id" = "listing_relationships"."child_listing_id")
        AND ("c"."created_by" = "auth"."uid"())
        AND ("c"."status" = ANY (ARRAY['pending'::"public"."listing_status", 'pending_payment'::"public"."listing_status"]))
    )
  )
  OR (
    EXISTS (
      SELECT 1 FROM "public"."listings" "p"
      WHERE ("p"."id" = "listing_relationships"."parent_listing_id")
        AND ("p"."created_by" = "auth"."uid"())
        AND ("p"."status" = ANY (ARRAY['pending'::"public"."listing_status", 'pending_payment'::"public"."listing_status"]))
    )
  )
);
