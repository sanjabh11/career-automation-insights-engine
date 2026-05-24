-- Commercialization proof-pack persistence.
-- Captures report-download leads and the report artifact rendered to the user.

CREATE TABLE IF NOT EXISTS public.commercial_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL CHECK (position('@' IN email) > 1),
  source TEXT NOT NULL,
  buyer_segment TEXT NOT NULL DEFAULT 'unknown',
  report_type TEXT NOT NULL DEFAULT 'occupation-risk',
  lead_dedupe_key TEXT,
  occupation_slug TEXT,
  occupation_title TEXT,
  risk_score NUMERIC(5,2),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'archived')),
  staff_notes TEXT CHECK (staff_notes IS NULL OR length(staff_notes) <= 2000),
  last_contacted_at TIMESTAMPTZ,
  report_html TEXT,
  consent_to_contact BOOLEAN NOT NULL DEFAULT FALSE,
  consent_text TEXT CHECK (consent_text IS NULL OR length(consent_text) <= 1000),
  consent_captured_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commercial_leads_email ON public.commercial_leads(lower(email));
CREATE INDEX IF NOT EXISTS idx_commercial_leads_source ON public.commercial_leads(source);
CREATE INDEX IF NOT EXISTS idx_commercial_leads_buyer_segment ON public.commercial_leads(buyer_segment);
CREATE INDEX IF NOT EXISTS idx_commercial_leads_status ON public.commercial_leads(status);
CREATE INDEX IF NOT EXISTS idx_commercial_leads_created_at ON public.commercial_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commercial_leads_metadata ON public.commercial_leads USING gin(metadata);
CREATE UNIQUE INDEX IF NOT EXISTS idx_commercial_leads_dedupe
  ON public.commercial_leads(lead_dedupe_key)
  WHERE lead_dedupe_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.commercial_staff (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('staff', 'admin')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.commercial_report_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_type TEXT NOT NULL DEFAULT 'html-report' CHECK (length(artifact_type) <= 80),
  title TEXT NOT NULL CHECK (length(title) <= 240),
  buyer_segment TEXT NOT NULL DEFAULT 'unknown' CHECK (length(buyer_segment) <= 120),
  report_type TEXT NOT NULL DEFAULT 'unknown' CHECK (length(report_type) <= 120),
  occupation_slug TEXT CHECK (occupation_slug IS NULL OR length(occupation_slug) <= 160),
  occupation_title TEXT CHECK (occupation_title IS NULL OR length(occupation_title) <= 240),
  occupation_code TEXT CHECK (occupation_code IS NULL OR length(occupation_code) <= 32),
  report_html TEXT NOT NULL CHECK (length(report_html) BETWEEN 100 AND 250000),
  source_versions JSONB NOT NULL DEFAULT '{}'::JSONB,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.commercial_report_artifact_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES public.commercial_report_artifacts(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.commercial_leads(id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('staff_opened', 'staff_downloaded', 'staff_open_failed')),
  delivery_channel TEXT NOT NULL DEFAULT 'lead-ops' CHECK (length(delivery_channel) <= 80),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.commercial_leads
  ADD COLUMN IF NOT EXISTS report_artifact_id UUID REFERENCES public.commercial_report_artifacts(id) ON DELETE SET NULL;
ALTER TABLE public.commercial_leads
  ADD COLUMN IF NOT EXISTS lead_dedupe_key TEXT;
ALTER TABLE public.commercial_leads
  ADD COLUMN IF NOT EXISTS consent_to_contact BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.commercial_leads
  ADD COLUMN IF NOT EXISTS consent_text TEXT;
ALTER TABLE public.commercial_leads
  ADD COLUMN IF NOT EXISTS consent_captured_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_commercial_report_artifacts_created_at
  ON public.commercial_report_artifacts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commercial_report_artifacts_type
  ON public.commercial_report_artifacts(artifact_type, report_type);
CREATE INDEX IF NOT EXISTS idx_commercial_report_artifact_events_artifact
  ON public.commercial_report_artifact_events(artifact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commercial_report_artifact_events_actor
  ON public.commercial_report_artifact_events(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commercial_leads_report_artifact
  ON public.commercial_leads(report_artifact_id);

ALTER TABLE public.commercial_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_report_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_report_artifact_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public can create commercial leads"
    ON public.commercial_leads
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
      email IS NOT NULL
      AND length(email) <= 320
      AND source IS NOT NULL
      AND length(source) <= 120
      AND length(coalesce(report_type, '')) <= 120
      AND status = 'new'
      AND staff_notes IS NULL
      AND last_contacted_at IS NULL
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Commercial staff can read own staff record"
    ON public.commercial_staff
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

GRANT INSERT ON public.commercial_leads TO anon, authenticated;
GRANT SELECT ON public.commercial_staff TO authenticated;

CREATE OR REPLACE FUNCTION public.is_commercial_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.commercial_staff AS staff
    WHERE staff.user_id = auth.uid()
      AND staff.active = TRUE
  );
$$;

CREATE OR REPLACE FUNCTION public.capture_commercial_lead(
  p_email TEXT,
  p_source TEXT,
  p_buyer_segment TEXT DEFAULT 'unknown',
  p_report_type TEXT DEFAULT 'occupation-risk',
  p_report_artifact_id UUID DEFAULT NULL,
  p_occupation_slug TEXT DEFAULT NULL,
  p_occupation_title TEXT DEFAULT NULL,
  p_risk_score NUMERIC DEFAULT NULL,
  p_report_html TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB,
  p_consent_to_contact BOOLEAN DEFAULT FALSE,
  p_consent_text TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  report_artifact_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT := lower(trim(COALESCE(p_email, '')));
  v_source TEXT := LEFT(COALESCE(NULLIF(trim(COALESCE(p_source, '')), ''), 'unknown'), 120);
  v_buyer_segment TEXT := LEFT(COALESCE(NULLIF(trim(COALESCE(p_buyer_segment, '')), ''), 'unknown'), 120);
  v_report_type TEXT := LEFT(COALESCE(NULLIF(trim(COALESCE(p_report_type, '')), ''), 'occupation-risk'), 120);
  v_occupation_slug TEXT := NULLIF(LEFT(COALESCE(trim(p_occupation_slug), ''), 160), '');
  v_occupation_title TEXT := NULLIF(LEFT(COALESCE(trim(p_occupation_title), ''), 240), '');
  v_consent_text TEXT := NULLIF(LEFT(COALESCE(trim(p_consent_text), ''), 1000), '');
  v_dedupe_key TEXT;
BEGIN
  IF v_email = '' OR position('@' IN v_email) <= 1 OR length(v_email) > 320 THEN
    RAISE EXCEPTION 'valid email is required';
  END IF;

  IF p_risk_score IS NOT NULL AND (p_risk_score < 0 OR p_risk_score > 100) THEN
    RAISE EXCEPTION 'risk score must be between 0 and 100';
  END IF;

  IF p_report_html IS NOT NULL AND length(p_report_html) > 250000 THEN
    RAISE EXCEPTION 'report html exceeds limit';
  END IF;

  IF p_report_artifact_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.commercial_report_artifacts AS artifact
    WHERE artifact.id = p_report_artifact_id
  ) THEN
    RAISE EXCEPTION 'report artifact not found';
  END IF;

  v_dedupe_key := v_email || '|' || v_source || '|' || v_report_type || '|' || COALESCE(v_occupation_slug, 'general');

  RETURN QUERY
  INSERT INTO public.commercial_leads AS lead (
    email,
    source,
    buyer_segment,
    report_type,
    lead_dedupe_key,
    report_artifact_id,
    occupation_slug,
    occupation_title,
    risk_score,
    report_html,
    consent_to_contact,
    consent_text,
    consent_captured_at,
    metadata
  )
  VALUES (
    v_email,
    v_source,
    v_buyer_segment,
    v_report_type,
    v_dedupe_key,
    p_report_artifact_id,
    v_occupation_slug,
    v_occupation_title,
	    p_risk_score,
	    p_report_html,
	    COALESCE(p_consent_to_contact, FALSE),
	    CASE WHEN COALESCE(p_consent_to_contact, FALSE) THEN v_consent_text ELSE NULL END,
	    CASE WHEN COALESCE(p_consent_to_contact, FALSE) THEN NOW() ELSE NULL END,
    COALESCE(p_metadata, '{}'::JSONB)
  )
  ON CONFLICT (lead_dedupe_key) WHERE lead_dedupe_key IS NOT NULL
  DO UPDATE SET
    buyer_segment = EXCLUDED.buyer_segment,
    report_artifact_id = COALESCE(EXCLUDED.report_artifact_id, lead.report_artifact_id),
    occupation_title = COALESCE(EXCLUDED.occupation_title, lead.occupation_title),
    risk_score = COALESCE(EXCLUDED.risk_score, lead.risk_score),
    report_html = COALESCE(EXCLUDED.report_html, lead.report_html),
    consent_to_contact = lead.consent_to_contact OR EXCLUDED.consent_to_contact,
    consent_text = COALESCE(EXCLUDED.consent_text, lead.consent_text),
    consent_captured_at = COALESCE(EXCLUDED.consent_captured_at, lead.consent_captured_at),
    metadata = lead.metadata
      || COALESCE(EXCLUDED.metadata, '{}'::JSONB)
      || jsonb_build_object(
        'duplicate_capture_count',
        COALESCE((lead.metadata->>'duplicate_capture_count')::INTEGER, 0) + 1,
        'last_duplicate_capture_at',
        NOW()
      ),
    updated_at = NOW()
  RETURNING
    lead.id,
    lead.report_artifact_id,
    lead.created_at,
    lead.updated_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_commercial_report_artifact(
  p_artifact_type TEXT,
  p_title TEXT,
  p_report_html TEXT,
  p_buyer_segment TEXT DEFAULT 'unknown',
  p_report_type TEXT DEFAULT 'unknown',
  p_occupation_slug TEXT DEFAULT NULL,
  p_occupation_title TEXT DEFAULT NULL,
  p_occupation_code TEXT DEFAULT NULL,
  p_source_versions JSONB DEFAULT '{}'::JSONB,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE (
  id UUID,
  artifact_type TEXT,
  title TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_report_html IS NULL OR length(trim(p_report_html)) < 100 THEN
    RAISE EXCEPTION 'report artifact html is required';
  END IF;

  IF length(p_report_html) > 250000 THEN
    RAISE EXCEPTION 'report artifact html exceeds limit';
  END IF;

  RETURN QUERY
  INSERT INTO public.commercial_report_artifacts AS artifact (
    artifact_type,
    title,
    buyer_segment,
    report_type,
    occupation_slug,
    occupation_title,
    occupation_code,
    report_html,
    source_versions,
    metadata
  )
  VALUES (
    LEFT(COALESCE(NULLIF(p_artifact_type, ''), 'html-report'), 80),
    LEFT(COALESCE(NULLIF(p_title, ''), 'Commercial report artifact'), 240),
    LEFT(COALESCE(NULLIF(p_buyer_segment, ''), 'unknown'), 120),
    LEFT(COALESCE(NULLIF(p_report_type, ''), 'unknown'), 120),
    NULLIF(LEFT(COALESCE(p_occupation_slug, ''), 160), ''),
    NULLIF(LEFT(COALESCE(p_occupation_title, ''), 240), ''),
    NULLIF(LEFT(COALESCE(p_occupation_code, ''), 32), ''),
    p_report_html,
    COALESCE(p_source_versions, '{}'::JSONB),
    COALESCE(p_metadata, '{}'::JSONB)
  )
  RETURNING
    artifact.id,
    artifact.artifact_type,
    artifact.title,
    artifact.created_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_commercial_report_artifact(p_artifact_id UUID)
RETURNS TABLE (
  id UUID,
  artifact_type TEXT,
  title TEXT,
  buyer_segment TEXT,
  report_type TEXT,
  occupation_slug TEXT,
  occupation_title TEXT,
  occupation_code TEXT,
  report_html TEXT,
  source_versions JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_commercial_staff() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
  SELECT
    artifact.id,
    artifact.artifact_type,
    artifact.title,
    artifact.buyer_segment,
    artifact.report_type,
    artifact.occupation_slug,
    artifact.occupation_title,
    artifact.occupation_code,
    artifact.report_html,
    artifact.source_versions,
    artifact.metadata,
    artifact.created_at
  FROM public.commercial_report_artifacts AS artifact
  WHERE artifact.id = p_artifact_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'report artifact not found';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_commercial_report_artifact_event(
  p_artifact_id UUID,
  p_event_type TEXT,
  p_lead_id UUID DEFAULT NULL,
  p_delivery_channel TEXT DEFAULT 'lead-ops',
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE (
  id UUID,
  artifact_id UUID,
  event_type TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_commercial_staff() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF p_event_type NOT IN ('staff_opened', 'staff_downloaded', 'staff_open_failed') THEN
    RAISE EXCEPTION 'invalid artifact event type';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.commercial_report_artifacts AS artifact
    WHERE artifact.id = p_artifact_id
  ) THEN
    RAISE EXCEPTION 'report artifact not found';
  END IF;

  IF p_lead_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.commercial_leads AS lead
    WHERE lead.id = p_lead_id
      AND lead.report_artifact_id = p_artifact_id
  ) THEN
    RAISE EXCEPTION 'lead is not linked to report artifact';
  END IF;

  RETURN QUERY
  INSERT INTO public.commercial_report_artifact_events AS artifact_event (
    artifact_id,
    lead_id,
    actor_user_id,
    event_type,
    delivery_channel,
    metadata
  )
  VALUES (
    p_artifact_id,
    p_lead_id,
    auth.uid(),
    p_event_type,
    LEFT(COALESCE(NULLIF(p_delivery_channel, ''), 'lead-ops'), 80),
    COALESCE(p_metadata, '{}'::JSONB)
  )
  RETURNING
    artifact_event.id,
    artifact_event.artifact_id,
    artifact_event.event_type,
    artifact_event.created_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_commercial_report_artifact_events(
  p_artifact_id UUID,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  artifact_id UUID,
  lead_id UUID,
  actor_user_id UUID,
  actor_email TEXT,
  event_type TEXT,
  delivery_channel TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_commercial_staff() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.commercial_report_artifacts AS artifact
    WHERE artifact.id = p_artifact_id
  ) THEN
    RAISE EXCEPTION 'report artifact not found';
  END IF;

  RETURN QUERY
  SELECT
    artifact_event.id,
    artifact_event.artifact_id,
    artifact_event.lead_id,
    artifact_event.actor_user_id,
    staff.email AS actor_email,
    artifact_event.event_type,
    artifact_event.delivery_channel,
    artifact_event.metadata,
    artifact_event.created_at
  FROM public.commercial_report_artifact_events AS artifact_event
  LEFT JOIN public.commercial_staff AS staff
    ON staff.user_id = artifact_event.actor_user_id
  WHERE artifact_event.artifact_id = p_artifact_id
  ORDER BY artifact_event.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 20), 1), 100);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_commercial_leads(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
  id UUID,
  email TEXT,
  source TEXT,
  buyer_segment TEXT,
  report_type TEXT,
  report_artifact_id UUID,
  occupation_slug TEXT,
  occupation_title TEXT,
  risk_score NUMERIC,
	  status TEXT,
	  staff_notes TEXT,
	  last_contacted_at TIMESTAMPTZ,
	  consent_to_contact BOOLEAN,
	  consent_text TEXT,
	  consent_captured_at TIMESTAMPTZ,
	  created_at TIMESTAMPTZ,
	  updated_at TIMESTAMPTZ,
	  metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_commercial_staff() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
  SELECT
    lead.id,
    lead.email,
    lead.source,
    lead.buyer_segment,
    lead.report_type,
    lead.report_artifact_id,
    lead.occupation_slug,
    lead.occupation_title,
    lead.risk_score,
	    lead.status,
	    lead.staff_notes,
	    lead.last_contacted_at,
	    lead.consent_to_contact,
	    lead.consent_text,
	    lead.consent_captured_at,
	    lead.created_at,
	    lead.updated_at,
	    lead.metadata
  FROM public.commercial_leads AS lead
  ORDER BY lead.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 100), 1), 500);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_commercial_lead_status(
  p_lead_id UUID,
  p_status TEXT,
  p_staff_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  source TEXT,
  buyer_segment TEXT,
  report_type TEXT,
  report_artifact_id UUID,
  occupation_slug TEXT,
  occupation_title TEXT,
  risk_score NUMERIC,
	  status TEXT,
	  staff_notes TEXT,
	  last_contacted_at TIMESTAMPTZ,
	  consent_to_contact BOOLEAN,
	  consent_text TEXT,
	  consent_captured_at TIMESTAMPTZ,
	  created_at TIMESTAMPTZ,
	  updated_at TIMESTAMPTZ,
	  metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_commercial_staff() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF p_status NOT IN ('new', 'contacted', 'qualified', 'converted', 'archived') THEN
    RAISE EXCEPTION 'invalid lead status';
  END IF;

  RETURN QUERY
  UPDATE public.commercial_leads AS lead
  SET
    status = p_status,
    staff_notes = NULLIF(LEFT(COALESCE(p_staff_notes, ''), 2000), ''),
    last_contacted_at = CASE
      WHEN p_status IN ('contacted', 'qualified', 'converted') THEN NOW()
      ELSE lead.last_contacted_at
    END,
    updated_at = NOW()
  WHERE lead.id = p_lead_id
  RETURNING
    lead.id,
    lead.email,
    lead.source,
    lead.buyer_segment,
    lead.report_type,
    lead.report_artifact_id,
    lead.occupation_slug,
    lead.occupation_title,
    lead.risk_score,
	    lead.status,
	    lead.staff_notes,
	    lead.last_contacted_at,
	    lead.consent_to_contact,
	    lead.consent_text,
	    lead.consent_captured_at,
	    lead.created_at,
	    lead.updated_at,
	    lead.metadata;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'lead not found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.is_commercial_staff() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.capture_commercial_lead(TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, NUMERIC, TEXT, JSONB, BOOLEAN, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_commercial_report_artifact(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_commercial_report_artifact(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.log_commercial_report_artifact_event(UUID, TEXT, UUID, TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_commercial_report_artifact_events(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_commercial_leads(INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_commercial_lead_status(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_commercial_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.capture_commercial_lead(TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, NUMERIC, TEXT, JSONB, BOOLEAN, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_commercial_report_artifact(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_commercial_report_artifact(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_commercial_report_artifact_event(UUID, TEXT, UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_commercial_report_artifact_events(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_commercial_leads(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_commercial_lead_status(UUID, TEXT, TEXT) TO authenticated;

COMMENT ON TABLE public.commercial_leads IS 'Commercial proof-pack lead capture and report artifact persistence for SEO, coach, and workforce outreach.';
COMMENT ON TABLE public.commercial_staff IS 'Allowlist for staff users who can operate commercial proof-pack leads through RLS-backed RPCs.';
COMMENT ON TABLE public.commercial_report_artifacts IS 'Durable report artifacts with stable IDs for commercial follow-up and staff retrieval.';
COMMENT ON TABLE public.commercial_report_artifact_events IS 'Append-only staff delivery/open/download event log for commercial report artifacts.';
COMMENT ON COLUMN public.commercial_leads.lead_dedupe_key IS 'Normalized email/source/report/occupation fingerprint used by capture_commercial_lead to merge repeat captures.';
COMMENT ON COLUMN public.commercial_leads.consent_to_contact IS 'Whether the visitor explicitly agreed to be contacted about the downloaded or generated commercial proof-pack artifact.';
COMMENT ON COLUMN public.commercial_leads.report_artifact_id IS 'Stable artifact reference created before lead capture; public users cannot read artifacts directly.';
COMMENT ON COLUMN public.commercial_leads.report_html IS 'Client-rendered report artifact used for download proof; production can replace with signed storage URL.';
COMMENT ON COLUMN public.commercial_leads.metadata IS 'Source versions, UTM params, caveats, and non-secret capture context.';
COMMENT ON FUNCTION public.capture_commercial_lead(TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, NUMERIC, TEXT, JSONB, BOOLEAN, TEXT) IS 'Public deduping lead-capture endpoint with consent fields and stable report artifact linkage.';
COMMENT ON FUNCTION public.create_commercial_report_artifact(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB) IS 'Insert-only public endpoint for creating bounded commercial report artifacts and returning a stable artifact ID.';
COMMENT ON FUNCTION public.get_commercial_report_artifact(UUID) IS 'Staff-only report artifact retrieval endpoint.';
COMMENT ON FUNCTION public.log_commercial_report_artifact_event(UUID, TEXT, UUID, TEXT, JSONB) IS 'Staff-only append endpoint for artifact open/download delivery audit events.';
COMMENT ON FUNCTION public.get_commercial_report_artifact_events(UUID, INTEGER) IS 'Staff-only recent delivery/open/download history for one commercial report artifact.';
COMMENT ON FUNCTION public.get_commercial_leads(INTEGER) IS 'Staff-only commercial lead read endpoint. Does not expose full report_html artifacts.';
COMMENT ON FUNCTION public.update_commercial_lead_status(UUID, TEXT, TEXT) IS 'Staff-only commercial lead disposition and notes update endpoint.';

CREATE TABLE IF NOT EXISTS public.commercial_workforce_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL DEFAULT 'demo' CHECK (length(org_id) <= 120),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL DEFAULT 'workforce-audit.csv' CHECK (length(file_name) <= 240),
  source_csv TEXT CHECK (source_csv IS NULL OR length(source_csv) <= 100000),
  row_count INTEGER NOT NULL DEFAULT 0 CHECK (row_count >= 0 AND row_count <= 500),
  total_headcount INTEGER NOT NULL DEFAULT 0 CHECK (total_headcount >= 0),
  weighted_exposure NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (weighted_exposure >= 0 AND weighted_exposure <= 100),
  high_risk_headcount INTEGER NOT NULL DEFAULT 0 CHECK (high_risk_headcount >= 0),
  high_risk_payroll NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (high_risk_payroll >= 0),
  mapped_rows INTEGER NOT NULL DEFAULT 0 CHECK (mapped_rows >= 0),
  unmapped_rows INTEGER NOT NULL DEFAULT 0 CHECK (unmapped_rows >= 0),
  source_versions JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.commercial_workforce_audit_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.commercial_workforce_audits(id) ON DELETE CASCADE,
  row_index INTEGER NOT NULL DEFAULT 0 CHECK (row_index >= 0),
  department TEXT NOT NULL CHECK (length(department) <= 200),
  role TEXT NOT NULL CHECK (length(role) <= 240),
  headcount INTEGER NOT NULL DEFAULT 0 CHECK (headcount >= 0),
  avg_salary NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (avg_salary >= 0),
  apo_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (apo_score >= 0 AND apo_score <= 100),
  soc_code TEXT CHECK (soc_code IS NULL OR length(soc_code) <= 32),
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'mapped', 'reviewed', 'unable_to_map')),
  review_notes TEXT CHECK (review_notes IS NULL OR length(review_notes) <= 2000),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commercial_workforce_audits_created_at
  ON public.commercial_workforce_audits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commercial_workforce_audits_org_id
  ON public.commercial_workforce_audits(org_id);
CREATE INDEX IF NOT EXISTS idx_commercial_workforce_audit_rows_audit_id
  ON public.commercial_workforce_audit_rows(audit_id, row_index);
CREATE INDEX IF NOT EXISTS idx_commercial_workforce_audit_rows_review
  ON public.commercial_workforce_audit_rows(review_status, soc_code);

ALTER TABLE public.commercial_workforce_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_workforce_audit_rows ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.create_commercial_workforce_audit(
  p_org_id TEXT,
  p_file_name TEXT,
  p_source_csv TEXT,
  p_summary JSONB,
  p_rows JSONB,
  p_source_versions JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE (
  id UUID,
  org_id TEXT,
  file_name TEXT,
  source_csv TEXT,
  row_count INTEGER,
  total_headcount INTEGER,
  weighted_exposure NUMERIC,
  high_risk_headcount INTEGER,
  high_risk_payroll NUMERIC,
  mapped_rows INTEGER,
  unmapped_rows INTEGER,
  source_versions JSONB,
  rows JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_audit_id UUID;
  v_rows JSONB := COALESCE(p_rows, '[]'::JSONB);
BEGIN
  IF NOT public.is_commercial_staff() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF jsonb_typeof(v_rows) <> 'array' THEN
    RAISE EXCEPTION 'workforce audit rows must be a JSON array';
  END IF;

  IF jsonb_array_length(v_rows) = 0 THEN
    RAISE EXCEPTION 'workforce audit must contain at least one role row';
  END IF;

  IF jsonb_array_length(v_rows) > 500 THEN
    RAISE EXCEPTION 'workforce audit row limit exceeded';
  END IF;

  INSERT INTO public.commercial_workforce_audits AS audit (
    org_id,
    created_by,
    file_name,
    source_csv,
    row_count,
    total_headcount,
    weighted_exposure,
    high_risk_headcount,
    high_risk_payroll,
    mapped_rows,
    unmapped_rows,
    source_versions
  )
  VALUES (
    LEFT(COALESCE(NULLIF(p_org_id, ''), 'demo'), 120),
    auth.uid(),
    LEFT(COALESCE(NULLIF(p_file_name, ''), 'workforce-audit.csv'), 240),
    LEFT(COALESCE(p_source_csv, ''), 100000),
    jsonb_array_length(v_rows),
    COALESCE(NULLIF(p_summary->>'totalHeadcount', '')::INTEGER, 0),
    COALESCE(NULLIF(p_summary->>'weightedExposure', '')::NUMERIC, 0),
    COALESCE(NULLIF(p_summary->>'highRiskHeadcount', '')::INTEGER, 0),
    COALESCE(NULLIF(p_summary->>'highRiskPayroll', '')::NUMERIC, 0),
    COALESCE(NULLIF(p_summary->>'mappedRows', '')::INTEGER, 0),
    COALESCE(NULLIF(p_summary->>'unmappedRows', '')::INTEGER, 0),
    COALESCE(p_source_versions, '{}'::JSONB)
  )
  RETURNING audit.id INTO v_audit_id;

  INSERT INTO public.commercial_workforce_audit_rows (
    audit_id,
    row_index,
    department,
    role,
    headcount,
    avg_salary,
    apo_score,
    soc_code,
    review_status
  )
  SELECT
    v_audit_id,
    parsed.ordinality::INTEGER,
    LEFT(COALESCE(parsed.row_data->>'department', ''), 200),
    LEFT(COALESCE(parsed.row_data->>'role', ''), 240),
    GREATEST(COALESCE(NULLIF(parsed.row_data->>'headcount', '')::INTEGER, 0), 0),
    GREATEST(COALESCE(NULLIF(parsed.row_data->>'avgSalary', '')::NUMERIC, 0), 0),
    LEAST(GREATEST(COALESCE(NULLIF(parsed.row_data->>'apoScore', '')::NUMERIC, 0), 0), 100),
    NULLIF(LEFT(COALESCE(parsed.row_data->>'socCode', ''), 32), ''),
    CASE
      WHEN NULLIF(LEFT(COALESCE(parsed.row_data->>'socCode', ''), 32), '') IS NULL THEN 'pending'
      ELSE 'mapped'
    END
  FROM jsonb_array_elements(v_rows) WITH ORDINALITY AS parsed(row_data, ordinality)
  WHERE COALESCE(parsed.row_data->>'department', '') <> ''
    AND COALESCE(parsed.row_data->>'role', '') <> '';

  RETURN QUERY
  SELECT
    audit.id,
    audit.org_id,
    audit.file_name,
    audit.source_csv,
    audit.row_count,
    audit.total_headcount,
    audit.weighted_exposure,
    audit.high_risk_headcount,
    audit.high_risk_payroll,
    audit.mapped_rows,
    audit.unmapped_rows,
    audit.source_versions,
    row_payload.rows,
    audit.created_at,
    audit.updated_at
  FROM public.commercial_workforce_audits AS audit
  LEFT JOIN LATERAL (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'department', audit_row.department,
          'role', audit_row.role,
          'headcount', audit_row.headcount,
          'avgSalary', audit_row.avg_salary,
          'apoScore', audit_row.apo_score,
          'socCode', audit_row.soc_code,
          'id', audit_row.id,
          'reviewStatus', audit_row.review_status,
          'reviewNotes', audit_row.review_notes,
          'reviewedAt', audit_row.reviewed_at
        )
        ORDER BY audit_row.row_index
      ),
      '[]'::JSONB
    ) AS rows
    FROM public.commercial_workforce_audit_rows AS audit_row
    WHERE audit_row.audit_id = audit.id
  ) AS row_payload ON TRUE
  WHERE audit.id = v_audit_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_commercial_workforce_audits(p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  id UUID,
  org_id TEXT,
  file_name TEXT,
  source_csv TEXT,
  row_count INTEGER,
  total_headcount INTEGER,
  weighted_exposure NUMERIC,
  high_risk_headcount INTEGER,
  high_risk_payroll NUMERIC,
  mapped_rows INTEGER,
  unmapped_rows INTEGER,
  source_versions JSONB,
  rows JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_commercial_staff() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
  SELECT
    audit.id,
    audit.org_id,
    audit.file_name,
    audit.source_csv,
    audit.row_count,
    audit.total_headcount,
    audit.weighted_exposure,
    audit.high_risk_headcount,
    audit.high_risk_payroll,
    audit.mapped_rows,
    audit.unmapped_rows,
    audit.source_versions,
    '[]'::JSONB AS rows,
    audit.created_at,
    audit.updated_at
  FROM public.commercial_workforce_audits AS audit
  ORDER BY audit.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 20), 1), 100);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_commercial_workforce_audit(p_audit_id UUID)
RETURNS TABLE (
  id UUID,
  org_id TEXT,
  file_name TEXT,
  source_csv TEXT,
  row_count INTEGER,
  total_headcount INTEGER,
  weighted_exposure NUMERIC,
  high_risk_headcount INTEGER,
  high_risk_payroll NUMERIC,
  mapped_rows INTEGER,
  unmapped_rows INTEGER,
  source_versions JSONB,
  rows JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_commercial_staff() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
  SELECT
    audit.id,
    audit.org_id,
    audit.file_name,
    audit.source_csv,
    audit.row_count,
    audit.total_headcount,
    audit.weighted_exposure,
    audit.high_risk_headcount,
    audit.high_risk_payroll,
    audit.mapped_rows,
    audit.unmapped_rows,
    audit.source_versions,
    row_payload.rows,
    audit.created_at,
    audit.updated_at
  FROM public.commercial_workforce_audits AS audit
  LEFT JOIN LATERAL (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'department', audit_row.department,
          'role', audit_row.role,
          'headcount', audit_row.headcount,
          'avgSalary', audit_row.avg_salary,
          'apoScore', audit_row.apo_score,
          'socCode', audit_row.soc_code,
          'id', audit_row.id,
          'reviewStatus', audit_row.review_status,
          'reviewNotes', audit_row.review_notes,
          'reviewedAt', audit_row.reviewed_at
        )
        ORDER BY audit_row.row_index
      ),
      '[]'::JSONB
    ) AS rows
    FROM public.commercial_workforce_audit_rows AS audit_row
    WHERE audit_row.audit_id = audit.id
  ) AS row_payload ON TRUE
  WHERE audit.id = p_audit_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'workforce audit not found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.create_commercial_workforce_audit(TEXT, TEXT, TEXT, JSONB, JSONB, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_commercial_workforce_audits(INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_commercial_workforce_audit(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_commercial_workforce_audit(TEXT, TEXT, TEXT, JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_commercial_workforce_audits(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_commercial_workforce_audit(UUID) TO authenticated;

COMMENT ON TABLE public.commercial_workforce_audits IS 'Staff-gated workforce CSV audit summaries for commercial enterprise pilots.';
COMMENT ON TABLE public.commercial_workforce_audit_rows IS 'Role-level rows attached to commercial workforce audit summaries.';
COMMENT ON FUNCTION public.create_commercial_workforce_audit(TEXT, TEXT, TEXT, JSONB, JSONB, JSONB) IS 'Staff-only persistence endpoint for workforce audit rows and executive summary metrics.';
COMMENT ON FUNCTION public.list_commercial_workforce_audits(INTEGER) IS 'Staff-only recent workforce audit list for reloadable pilot artifacts.';
COMMENT ON FUNCTION public.get_commercial_workforce_audit(UUID) IS 'Staff-only workforce audit detail endpoint with role rows.';

CREATE OR REPLACE FUNCTION public.list_commercial_workforce_review_rows(
  p_audit_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  audit_id UUID,
  audit_file_name TEXT,
  org_id TEXT,
  department TEXT,
  role TEXT,
  headcount INTEGER,
  avg_salary NUMERIC,
  apo_score NUMERIC,
  soc_code TEXT,
  review_status TEXT,
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_commercial_staff() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
  SELECT
    audit_row.id,
    audit_row.audit_id,
    audit.file_name,
    audit.org_id,
    audit_row.department,
    audit_row.role,
    audit_row.headcount,
    audit_row.avg_salary,
    audit_row.apo_score,
    audit_row.soc_code,
    audit_row.review_status,
    audit_row.review_notes,
    audit_row.reviewed_at,
    audit_row.created_at
  FROM public.commercial_workforce_audit_rows AS audit_row
  JOIN public.commercial_workforce_audits AS audit
    ON audit.id = audit_row.audit_id
  WHERE (p_audit_id IS NULL OR audit_row.audit_id = p_audit_id)
    AND (audit_row.soc_code IS NULL OR audit_row.review_status IN ('pending', 'unable_to_map'))
  ORDER BY audit_row.created_at DESC, audit_row.row_index ASC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 100), 1), 500);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_commercial_workforce_row_mapping(
  p_row_id UUID,
  p_soc_code TEXT,
  p_review_status TEXT DEFAULT 'reviewed',
  p_review_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  audit_id UUID,
  audit_file_name TEXT,
  org_id TEXT,
  department TEXT,
  role TEXT,
  headcount INTEGER,
  avg_salary NUMERIC,
  apo_score NUMERIC,
  soc_code TEXT,
  review_status TEXT,
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_audit_id UUID;
  v_soc_code TEXT := NULLIF(UPPER(LEFT(TRIM(COALESCE(p_soc_code, '')), 32)), '');
BEGIN
  IF NOT public.is_commercial_staff() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF p_review_status NOT IN ('pending', 'mapped', 'reviewed', 'unable_to_map') THEN
    RAISE EXCEPTION 'invalid review status';
  END IF;

  IF p_review_status IN ('mapped', 'reviewed') AND v_soc_code IS NULL THEN
    RAISE EXCEPTION 'SOC code is required for mapped or reviewed rows';
  END IF;

  UPDATE public.commercial_workforce_audit_rows AS audit_row
  SET
    soc_code = v_soc_code,
    review_status = p_review_status,
    review_notes = NULLIF(LEFT(COALESCE(p_review_notes, ''), 2000), ''),
    reviewed_at = CASE
      WHEN p_review_status IN ('mapped', 'reviewed', 'unable_to_map') THEN NOW()
      ELSE NULL
    END
  WHERE audit_row.id = p_row_id
  RETURNING audit_row.audit_id INTO v_audit_id;

  IF v_audit_id IS NULL THEN
    RAISE EXCEPTION 'workforce audit row not found';
  END IF;

  UPDATE public.commercial_workforce_audits AS audit
  SET
    mapped_rows = (
      SELECT COUNT(*)::INTEGER
      FROM public.commercial_workforce_audit_rows AS audit_row
      WHERE audit_row.audit_id = v_audit_id
        AND audit_row.soc_code IS NOT NULL
    ),
    unmapped_rows = (
      SELECT COUNT(*)::INTEGER
      FROM public.commercial_workforce_audit_rows AS audit_row
      WHERE audit_row.audit_id = v_audit_id
        AND audit_row.soc_code IS NULL
    ),
    updated_at = NOW()
  WHERE audit.id = v_audit_id;

  RETURN QUERY
  SELECT
    audit_row.id,
    audit_row.audit_id,
    audit.file_name,
    audit.org_id,
    audit_row.department,
    audit_row.role,
    audit_row.headcount,
    audit_row.avg_salary,
    audit_row.apo_score,
    audit_row.soc_code,
    audit_row.review_status,
    audit_row.review_notes,
    audit_row.reviewed_at,
    audit_row.created_at
  FROM public.commercial_workforce_audit_rows AS audit_row
  JOIN public.commercial_workforce_audits AS audit
    ON audit.id = audit_row.audit_id
  WHERE audit_row.id = p_row_id;
END;
$$;

REVOKE ALL ON FUNCTION public.list_commercial_workforce_review_rows(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_commercial_workforce_row_mapping(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_commercial_workforce_review_rows(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_commercial_workforce_row_mapping(UUID, TEXT, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION public.list_commercial_workforce_review_rows(UUID, INTEGER) IS 'Staff-only queue of workforce audit rows needing SOC/O*NET mapping review.';
COMMENT ON FUNCTION public.update_commercial_workforce_row_mapping(UUID, TEXT, TEXT, TEXT) IS 'Staff-only SOC/O*NET mapping update for saved workforce audit rows.';
