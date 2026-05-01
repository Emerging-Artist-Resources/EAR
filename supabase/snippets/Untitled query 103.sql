-- Optional website URL for audition, creative opportunity, and class/workshop listings
-- (distinct from creative_details.link / submission instructions and class registration link)

ALTER TABLE public.audition_details
  ADD COLUMN IF NOT EXISTS website text;

ALTER TABLE public.creative_details
  ADD COLUMN IF NOT EXISTS website text;

ALTER TABLE public.class_workshop_details
  ADD COLUMN IF NOT EXISTS website text;
