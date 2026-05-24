-- ============================================================================
-- Resume Proof Report Artifacts
-- Career Automation Insights Engine - privacy-preserving report persistence
-- ============================================================================
-- Stores user-owned, redacted resume proof-report artifacts. These artifacts are
-- intended for coaching review and user retrieval only. They must not contain raw
-- resume text, original phrase rows, or detailed rewrite rows; those remain local
-- download artifacts unless a future institution-specific consent/storage flow is
-- approved.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.resume_proof_report_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES public.resume_analyses(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (length(title) <= 240),
  report_html_redacted TEXT NOT NULL CHECK (
    length(report_html_redacted) BETWEEN 100 AND 250000
    AND position('data-resume-proof-report-redacted="true"' IN report_html_redacted) > 0
    AND position('Raw resume text stored: no' IN report_html_redacted) > 0
  ),
  source_versions JSONB NOT NULL DEFAULT '{}'::JSONB,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  review_status TEXT NOT NULL DEFAULT 'staff_review_required'
    CHECK (review_status IN ('auto_generated', 'staff_review_required', 'staff_reviewed', 'coach_reviewed', 'client_ready')),
  raw_resume_text_stored BOOLEAN NOT NULL DEFAULT FALSE CHECK (raw_resume_text_stored = FALSE),
  resume_detail_rows_redacted BOOLEAN NOT NULL DEFAULT TRUE CHECK (resume_detail_rows_redacted = TRUE),
  retention_policy TEXT NOT NULL DEFAULT 'Saved artifact stores a redacted proof-report shell; raw resume text, phrase rows, and rewrite detail rows are not stored in this artifact.',
  source_ids TEXT[] NOT NULL DEFAULT ARRAY['nist-ai-rmf', 'ada-ai-hiring-guidance', 'eeoc-employment-selection-procedures', 'cfpb-employment-algorithmic-scores', 'llm-output'],
  caveat TEXT NOT NULL DEFAULT 'This saved artifact is a coaching and review aid only; it is not an employment decision, hiring screen, consumer report, or deletion proof for external provider logs, exports, downloads, or backups.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.resume_proof_report_artifact_deletion_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title_hash TEXT NOT NULL,
  deletion_scope TEXT NOT NULL DEFAULT 'resume_proof_report_artifacts saved redacted report row',
  deletion_status TEXT NOT NULL DEFAULT 'deleted'
    CHECK (deletion_status IN ('deleted', 'not_found_or_not_owned')),
  source_ids TEXT[] NOT NULL DEFAULT ARRAY['nist-ai-rmf', 'ada-ai-hiring-guidance', 'eeoc-employment-selection-procedures', 'cfpb-employment-algorithmic-scores', 'llm-output'],
  caveat TEXT NOT NULL DEFAULT 'Deletion receipt proves app-row deletion only; it is not legal certification, employment-decision validation, model-provider log deletion, browser-download deletion, or backup deletion proof.',
  receipt_hash TEXT NOT NULL UNIQUE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resume_proof_report_artifacts_user
ON public.resume_proof_report_artifacts(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_resume_proof_report_artifacts_analysis
ON public.resume_proof_report_artifacts(analysis_id);

CREATE INDEX IF NOT EXISTS idx_resume_proof_report_artifact_receipts_user
ON public.resume_proof_report_artifact_deletion_receipts(user_id, created_at DESC);

ALTER TABLE public.resume_proof_report_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_proof_report_artifact_deletion_receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own redacted resume proof artifacts" ON public.resume_proof_report_artifacts;
CREATE POLICY "Users can read own redacted resume proof artifacts"
  ON public.resume_proof_report_artifacts
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage redacted resume proof artifacts" ON public.resume_proof_report_artifacts;
CREATE POLICY "Service role can manage redacted resume proof artifacts"
  ON public.resume_proof_report_artifacts
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can read own resume proof artifact deletion receipts" ON public.resume_proof_report_artifact_deletion_receipts;
CREATE POLICY "Users can read own resume proof artifact deletion receipts"
  ON public.resume_proof_report_artifact_deletion_receipts
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage resume proof artifact deletion receipts" ON public.resume_proof_report_artifact_deletion_receipts;
CREATE POLICY "Service role can manage resume proof artifact deletion receipts"
  ON public.resume_proof_report_artifact_deletion_receipts
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION public.update_resume_proof_report_artifact_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_resume_proof_report_artifact_updated_at ON public.resume_proof_report_artifacts;
CREATE TRIGGER trigger_resume_proof_report_artifact_updated_at
  BEFORE UPDATE ON public.resume_proof_report_artifacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_resume_proof_report_artifact_updated_at();

CREATE OR REPLACE FUNCTION public.create_resume_proof_report_artifact(
  p_analysis_id UUID DEFAULT NULL,
  p_title TEXT DEFAULT 'Resume Work Transition Proof Report',
  p_report_html_redacted TEXT DEFAULT NULL,
  p_source_versions JSONB DEFAULT '{}'::JSONB,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE (
  id UUID,
  analysis_id UUID,
  title TEXT,
  review_status TEXT,
  raw_resume_text_stored BOOLEAN,
  resume_detail_rows_redacted BOOLEAN,
  retention_policy TEXT,
  source_ids TEXT[],
  caveat TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_review_status TEXT := COALESCE(NULLIF(p_metadata->>'review_status', ''), 'staff_review_required');
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  IF p_report_html_redacted IS NULL OR length(trim(p_report_html_redacted)) < 100 THEN
    RAISE EXCEPTION 'redacted report html is required';
  END IF;

  IF length(p_report_html_redacted) > 250000 THEN
    RAISE EXCEPTION 'redacted report html exceeds limit';
  END IF;

  IF position('data-resume-proof-report-redacted="true"' IN p_report_html_redacted) = 0 THEN
    RAISE EXCEPTION 'resume proof report artifact must be redacted';
  END IF;

  IF position('Raw resume text stored: no' IN p_report_html_redacted) = 0 THEN
    RAISE EXCEPTION 'resume proof report artifact must show raw-text storage boundary';
  END IF;

  IF p_analysis_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.resume_analyses AS analysis
    WHERE analysis.id = p_analysis_id
      AND analysis.user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'resume_analysis_not_found_or_not_owned';
  END IF;

  IF v_review_status NOT IN ('auto_generated', 'staff_review_required', 'staff_reviewed', 'coach_reviewed', 'client_ready') THEN
    v_review_status := 'staff_review_required';
  END IF;

  RETURN QUERY
  INSERT INTO public.resume_proof_report_artifacts AS artifact (
    user_id,
    analysis_id,
    title,
    report_html_redacted,
    source_versions,
    metadata,
    review_status,
    raw_resume_text_stored,
    resume_detail_rows_redacted
  )
  VALUES (
    v_user_id,
    p_analysis_id,
    LEFT(COALESCE(NULLIF(trim(p_title), ''), 'Resume Work Transition Proof Report'), 240),
    p_report_html_redacted,
    COALESCE(p_source_versions, '{}'::JSONB),
    COALESCE(p_metadata, '{}'::JSONB)
      || jsonb_build_object(
        'raw_resume_text_stored', false,
        'resume_detail_rows_redacted', true,
        'saved_artifact_employment_decision_boundary', 'not_for_hiring_firing_promotion_compensation_layoff_screening_or_eligibility'
      ),
    v_review_status,
    FALSE,
    TRUE
  )
  RETURNING
    artifact.id,
    artifact.analysis_id,
    artifact.title,
    artifact.review_status,
    artifact.raw_resume_text_stored,
    artifact.resume_detail_rows_redacted,
    artifact.retention_policy,
    artifact.source_ids,
    artifact.caveat,
    artifact.created_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_resume_proof_report_artifact_with_receipt(
  p_artifact_id UUID
)
RETURNS TABLE (
  receipt_id UUID,
  artifact_id UUID,
  title_hash TEXT,
  deletion_scope TEXT,
  deletion_status TEXT,
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
  v_title TEXT;
  v_requested_at TIMESTAMPTZ := NOW();
  v_deleted_at TIMESTAMPTZ;
  v_receipt_id UUID;
  v_title_hash TEXT;
  v_receipt_hash TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  SELECT artifact.title
  INTO v_title
  FROM public.resume_proof_report_artifacts AS artifact
  WHERE artifact.id = p_artifact_id
    AND artifact.user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'resume_proof_report_artifact_not_found_or_not_owned';
  END IF;

  DELETE FROM public.resume_proof_report_artifacts AS artifact
  WHERE artifact.id = p_artifact_id
    AND artifact.user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'resume_proof_report_artifact_delete_failed';
  END IF;

  v_deleted_at := NOW();
  v_title_hash := encode(digest(COALESCE(v_title, '') || ':' || p_artifact_id::TEXT, 'sha256'), 'hex');
  v_receipt_hash := encode(digest(
    p_artifact_id::TEXT || ':' ||
    v_user_id::TEXT || ':' ||
    v_requested_at::TEXT || ':' ||
    v_deleted_at::TEXT || ':' ||
    COALESCE(v_title, '') || ':resume_proof_report_artifact_delete_v1',
    'sha256'
  ), 'hex');

  INSERT INTO public.resume_proof_report_artifact_deletion_receipts (
    artifact_id,
    user_id,
    title_hash,
    receipt_hash,
    requested_at,
    deleted_at
  )
  VALUES (
    p_artifact_id,
    v_user_id,
    v_title_hash,
    v_receipt_hash,
    v_requested_at,
    v_deleted_at
  )
  RETURNING id INTO v_receipt_id;

  RETURN QUERY
  SELECT
    receipt.id,
    receipt.artifact_id,
    receipt.title_hash,
    receipt.deletion_scope,
    receipt.deletion_status,
    receipt.source_ids,
    receipt.caveat,
    receipt.receipt_hash,
    receipt.requested_at,
    receipt.deleted_at
  FROM public.resume_proof_report_artifact_deletion_receipts AS receipt
  WHERE receipt.id = v_receipt_id;
END;
$$;

GRANT SELECT ON public.resume_proof_report_artifacts TO authenticated;
GRANT SELECT ON public.resume_proof_report_artifact_deletion_receipts TO authenticated;
GRANT ALL ON public.resume_proof_report_artifacts TO service_role;
GRANT ALL ON public.resume_proof_report_artifact_deletion_receipts TO service_role;
GRANT EXECUTE ON FUNCTION public.create_resume_proof_report_artifact(UUID, TEXT, TEXT, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_resume_proof_report_artifact_with_receipt(UUID) TO authenticated;

COMMENT ON TABLE public.resume_proof_report_artifacts IS 'User-owned redacted resume proof-report artifacts for coaching review. Raw resume text and detailed phrase/rewrite rows are not stored.';
COMMENT ON TABLE public.resume_proof_report_artifact_deletion_receipts IS 'User-visible deletion receipts for saved redacted resume proof-report artifacts.';
COMMENT ON FUNCTION public.create_resume_proof_report_artifact(UUID, TEXT, TEXT, JSONB, JSONB) IS 'Creates an authenticated user-owned redacted resume proof-report artifact after checking redaction markers.';
COMMENT ON FUNCTION public.delete_resume_proof_report_artifact_with_receipt(UUID) IS 'Deletes an authenticated user-owned redacted resume proof-report artifact and returns an app-level deletion receipt with caveats.';
