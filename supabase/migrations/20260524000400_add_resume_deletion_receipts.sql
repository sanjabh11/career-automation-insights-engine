-- ============================================================================
-- Resume Analysis Deletion Receipts
-- Career Automation Insights Engine - commercial trust boundary
-- ============================================================================
-- Adds an auditable, user-visible deletion receipt for saved resume analyses.
-- The receipt proves the app deleted the saved resume_analyses row for the
-- authenticated user; it does not certify deletion from external model-provider
-- logs, browser downloads, backups, or exports outside configured retention.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.resume_analysis_deletion_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT,
  filename_hash TEXT NOT NULL,
  deletion_scope TEXT NOT NULL DEFAULT 'resume_analyses saved row and derived app record',
  deletion_status TEXT NOT NULL DEFAULT 'deleted'
    CHECK (deletion_status IN ('deleted', 'not_found_or_not_owned')),
  raw_text_retention_policy TEXT NOT NULL DEFAULT 'Raw resume text is redacted after analysis; saved row stores a redacted length-only stub.',
  model_provider_boundary TEXT NOT NULL DEFAULT 'External model-provider processing logs and backups are outside this app-level receipt.',
  source_ids TEXT[] NOT NULL DEFAULT ARRAY['nist-ai-rmf', 'ada-ai-hiring-guidance', 'llm-output'],
  caveat TEXT NOT NULL DEFAULT 'Deletion receipt proves app-row deletion only; it is not legal certification, employment-decision validation, or backup deletion proof.',
  receipt_hash TEXT NOT NULL UNIQUE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resume_deletion_receipts_user
ON public.resume_analysis_deletion_receipts(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_resume_deletion_receipts_analysis
ON public.resume_analysis_deletion_receipts(analysis_id);

ALTER TABLE public.resume_analysis_deletion_receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own resume deletion receipts" ON public.resume_analysis_deletion_receipts;
CREATE POLICY "Users can read own resume deletion receipts"
  ON public.resume_analysis_deletion_receipts
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage resume deletion receipts" ON public.resume_analysis_deletion_receipts;
CREATE POLICY "Service role can manage resume deletion receipts"
  ON public.resume_analysis_deletion_receipts
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION public.delete_resume_analysis_with_receipt(
  p_analysis_id UUID
)
RETURNS TABLE (
  receipt_id UUID,
  analysis_id UUID,
  filename TEXT,
  filename_hash TEXT,
  deletion_scope TEXT,
  deletion_status TEXT,
  raw_text_retention_policy TEXT,
  model_provider_boundary TEXT,
  source_ids TEXT[],
  caveat TEXT,
  receipt_hash TEXT,
  requested_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_filename TEXT;
  v_requested_at TIMESTAMPTZ := NOW();
  v_deleted_at TIMESTAMPTZ;
  v_receipt_id UUID;
  v_filename_hash TEXT;
  v_receipt_hash TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  SELECT ra.filename
  INTO v_filename
  FROM public.resume_analyses ra
  WHERE ra.id = p_analysis_id
    AND ra.user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'resume_analysis_not_found_or_not_owned';
  END IF;

  DELETE FROM public.resume_analyses ra
  WHERE ra.id = p_analysis_id
    AND ra.user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'resume_analysis_delete_failed';
  END IF;

  v_deleted_at := NOW();
  v_filename_hash := encode(digest(COALESCE(v_filename, '') || ':' || p_analysis_id::TEXT, 'sha256'), 'hex');
  v_receipt_hash := encode(digest(
    p_analysis_id::TEXT || ':' ||
    v_user_id::TEXT || ':' ||
    v_requested_at::TEXT || ':' ||
    v_deleted_at::TEXT || ':' ||
    COALESCE(v_filename, '') || ':resume_analysis_delete_v1',
    'sha256'
  ), 'hex');

  INSERT INTO public.resume_analysis_deletion_receipts (
    analysis_id,
    user_id,
    filename,
    filename_hash,
    receipt_hash,
    requested_at,
    deleted_at
  )
  VALUES (
    p_analysis_id,
    v_user_id,
    NULL,
    v_filename_hash,
    v_receipt_hash,
    v_requested_at,
    v_deleted_at
  )
  RETURNING id INTO v_receipt_id;

  RETURN QUERY
  SELECT
    r.id,
    r.analysis_id,
    r.filename,
    r.filename_hash,
    r.deletion_scope,
    r.deletion_status,
    r.raw_text_retention_policy,
    r.model_provider_boundary,
    r.source_ids,
    r.caveat,
    r.receipt_hash,
    r.requested_at,
    r.deleted_at
  FROM public.resume_analysis_deletion_receipts r
  WHERE r.id = v_receipt_id;
END;
$$;

GRANT SELECT ON public.resume_analysis_deletion_receipts TO authenticated;
GRANT ALL ON public.resume_analysis_deletion_receipts TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_resume_analysis_with_receipt(UUID) TO authenticated;

COMMENT ON TABLE public.resume_analysis_deletion_receipts IS 'User-visible deletion receipts for saved resume automation-risk analyses. Original filenames are minimized to filename_hash in new receipts.';
COMMENT ON FUNCTION public.delete_resume_analysis_with_receipt(UUID) IS 'Deletes an authenticated user resume analysis and returns an app-level deletion receipt with caveats.';
