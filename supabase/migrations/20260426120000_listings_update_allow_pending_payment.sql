-- Listing creation sets status to pending_payment when a listing fee applies.
-- The previous policy only allowed status = 'pending', so the payment-fields UPDATE
-- failed WITH CHECK after transitioning to pending_payment.

DROP POLICY IF EXISTS "Users can update their own listings" ON "public"."listings";

CREATE POLICY "Users can update their own listings" ON "public"."listings"
  FOR UPDATE TO "authenticated"
  USING (
    ("created_by" = "auth"."uid"())
    AND ("status" = ANY (ARRAY['pending'::"public"."listing_status", 'pending_payment'::"public"."listing_status"]))
  )
  WITH CHECK (
    ("created_by" = "auth"."uid"())
    AND ("status" = ANY (ARRAY['pending'::"public"."listing_status", 'pending_payment'::"public"."listing_status"]))
  );
