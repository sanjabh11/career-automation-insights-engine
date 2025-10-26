-- Update unique key to broaden conflict target for richer dedup
-- Safe to run multiple times
DO $$ BEGIN
  ALTER TABLE public.automation_economics
    DROP CONSTRAINT IF EXISTS automation_economics_task_category_industry_sector_key;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

-- Ensure columns exist (idempotent: add if missing)
ALTER TABLE public.automation_economics
  ADD COLUMN IF NOT EXISTS as_of_year INTEGER,
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT;

-- Add new unique constraint across category, sector, time, and geography
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE c.conname = 'automation_economics_unique_key'
      AND t.relname = 'automation_economics'
      AND c.contype = 'u'
  ) THEN
    ALTER TABLE public.automation_economics
      ADD CONSTRAINT automation_economics_unique_key
      UNIQUE (task_category, industry_sector, as_of_year, region, country);
  END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_ae_sector_category ON public.automation_economics(industry_sector, task_category);
CREATE INDEX IF NOT EXISTS idx_ae_year ON public.automation_economics(as_of_year);
CREATE INDEX IF NOT EXISTS idx_ae_region_country ON public.automation_economics(region, country);
