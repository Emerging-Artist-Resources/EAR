-- Clear platform listing fee configuration on performance and class listings.
-- Performance/class platform fees are waived for all artist types; stale PAY_FEE rows
-- should not trigger checkout. fee-calculator also defends against stale data.

UPDATE performance_details
SET listing_fee_option = NULL,
    listing_fee_explanation = NULL,
    complementary_ticket_info = NULL
WHERE listing_fee_option IS NOT NULL
   OR listing_fee_explanation IS NOT NULL
   OR complementary_ticket_info IS NOT NULL;

UPDATE class_workshop_details
SET listing_fee_option = NULL,
    listing_fee_explanation = NULL,
    guest_spot_info = NULL
WHERE listing_fee_option IS NOT NULL
   OR listing_fee_explanation IS NOT NULL
   OR guest_spot_info IS NOT NULL;

-- Reset payment fields on performance/class listings stuck awaiting obsolete fees.
UPDATE listings
SET payment_required = false,
    payment_amount = NULL,
    payment_status = 'not_required',
    stripe_checkout_session_id = NULL,
    status = 'pending'
WHERE type IN ('performance', 'class')
  AND payment_required = true
  AND status = 'pending_payment';
