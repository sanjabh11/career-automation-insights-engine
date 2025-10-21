-- Add description column to onet_job_zones for simplified seeding
-- This allows us to use a single description field instead of separate education/experience/training fields

ALTER TABLE public.onet_job_zones
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Update existing records to populate description from education field
UPDATE public.onet_job_zones
SET description = education
WHERE description IS NULL AND education IS NOT NULL;

COMMENT ON COLUMN public.onet_job_zones.description IS 'Simplified description of job zone preparation requirements';
