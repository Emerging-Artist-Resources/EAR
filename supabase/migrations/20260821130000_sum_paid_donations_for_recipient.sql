-- Scoped sum for fiscal sponsorship dashboard (PostgREST aggregates are disabled: PGRST123).
-- SECURITY INVOKER so donations RLS applies; also require caller is the recipient or admin.

CREATE OR REPLACE FUNCTION public.sum_paid_donations_for_recipient(
  p_recipient_user_id uuid,
  p_created_from timestamptz DEFAULT NULL,
  p_created_to timestamptz DEFAULT NULL
)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(d.amount), 0)::bigint
  FROM public.donations AS d
  WHERE d.recipient_user_id = p_recipient_user_id
    AND d.payment_status = 'paid'::public.payment_status
    AND (p_created_from IS NULL OR d.created_at >= p_created_from)
    AND (p_created_to IS NULL OR d.created_at <= p_created_to)
    AND (
      p_recipient_user_id = auth.uid()
      OR public.is_admin()
    );
$$;

COMMENT ON FUNCTION public.sum_paid_donations_for_recipient(uuid, timestamptz, timestamptz) IS
  'Sum of paid donation amount (cents) for a recipient, with optional inclusive created_at bounds. Caller must be the recipient or an admin.';

REVOKE ALL ON FUNCTION public.sum_paid_donations_for_recipient(uuid, timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sum_paid_donations_for_recipient(uuid, timestamptz, timestamptz) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.sum_paid_donations_for_recipient(uuid, timestamptz, timestamptz) FROM anon;
