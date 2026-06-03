-- Fix live Supabase projects where pgcrypto is installed in the `extensions`
-- schema and SECURITY DEFINER functions use search_path=public.

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
  v_filename_hash := encode(extensions.digest(COALESCE(v_filename, '') || ':' || p_analysis_id::TEXT, 'sha256'), 'hex');
  v_receipt_hash := encode(extensions.digest(
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
  v_title_hash := encode(extensions.digest(COALESCE(v_title, '') || ':' || p_artifact_id::TEXT, 'sha256'), 'hex');
  v_receipt_hash := encode(extensions.digest(
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

GRANT EXECUTE ON FUNCTION public.delete_resume_analysis_with_receipt(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_resume_proof_report_artifact_with_receipt(UUID) TO authenticated;
