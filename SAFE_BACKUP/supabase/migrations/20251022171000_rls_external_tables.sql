-- Enable RLS and define read-only policies for external/public reference tables
ALTER TABLE public.bls_employment_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_economics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_demand_signals ENABLE ROW LEVEL SECURITY;

-- Public read access (anon/auth) for reference data
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='bls_employment_data' AND policyname='public_read_bls' ) THEN
    CREATE POLICY public_read_bls ON public.bls_employment_data FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='automation_economics' AND policyname='public_read_econ' ) THEN
    CREATE POLICY public_read_econ ON public.automation_economics FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='skill_demand_signals' AND policyname='public_read_skills' ) THEN
    CREATE POLICY public_read_skills ON public.skill_demand_signals FOR SELECT USING (true);
  END IF;
END $$;

-- NOTE: No INSERT/UPDATE/DELETE policies are defined; only service role can write (bypasses RLS).
