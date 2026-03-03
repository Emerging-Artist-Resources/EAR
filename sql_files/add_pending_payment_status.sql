-- ============================================================================
-- ADD pending_payment TO listing_status ENUM
-- /Users/kaylalaufer/Documents/EAR/performance-calendar/sql_files/add_pending_payment_status.sql
-- ============================================================================
-- This is in a separate migration file because ALTER TYPE ... ADD VALUE
-- cannot run inside a transaction block in some PostgreSQL setups.
-- Supabase migrations usually run each file in a transaction, which can
-- cause issues with this statement.
-- ============================================================================

ALTER TYPE listing_status ADD VALUE IF NOT EXISTS 'pending_payment';
