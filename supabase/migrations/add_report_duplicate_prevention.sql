-- Add UNIQUE constraint to prevent duplicate reports (security: abuse prevention)
-- This ensures at the database level that a user cannot report the same item multiple times

ALTER TABLE public.item_reports
DROP CONSTRAINT IF EXISTS item_reports_item_id_reporter_id_key;

ALTER TABLE public.item_reports
ADD CONSTRAINT item_reports_item_id_reporter_id_key UNIQUE (item_id, reporter_id);
