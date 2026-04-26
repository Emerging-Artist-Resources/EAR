-- Allow submitters to remove their own listings while still in draft / pre-checkout states.
-- Rollback in createListingOwnedRepo uses the service role; this policy supports explicit
-- user-initiated deletes and any code paths that still use the user-scoped client.

CREATE POLICY "Users can delete their own draft listings" ON "public"."listings"
  FOR DELETE TO "authenticated"
  USING (
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
