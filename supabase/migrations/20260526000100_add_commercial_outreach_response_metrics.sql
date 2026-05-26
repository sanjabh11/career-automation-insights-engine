-- Staff-only response metrics for founder-led proof-pack outreach.
-- Metrics stay on commercial_leads.metadata to avoid broad table churn while
-- preserving a durable audit trail for pilot conversion learning.

CREATE OR REPLACE FUNCTION public.update_commercial_lead_response_metrics(
  p_lead_id UUID,
  p_replied_at TIMESTAMPTZ DEFAULT NULL,
  p_reply_sentiment TEXT DEFAULT 'none',
  p_meeting_booked_at TIMESTAMPTZ DEFAULT NULL,
  p_sample_report_sent_at TIMESTAMPTZ DEFAULT NULL,
  p_usefulness_score INTEGER DEFAULT NULL,
  p_objection_category TEXT DEFAULT 'none',
  p_case_study_permission BOOLEAN DEFAULT FALSE,
  p_paid_pilot_signal BOOLEAN DEFAULT FALSE,
  p_unsubscribe_requested BOOLEAN DEFAULT FALSE,
  p_response_notes TEXT DEFAULT NULL
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
DECLARE
  v_reply_sentiment TEXT := lower(trim(coalesce(p_reply_sentiment, 'none')));
  v_objection_category TEXT := lower(trim(coalesce(p_objection_category, 'none')));
  v_usefulness_score INTEGER := p_usefulness_score;
BEGIN
  IF NOT public.is_commercial_staff() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF v_reply_sentiment NOT IN ('none', 'positive', 'neutral', 'objection', 'not_interested') THEN
    RAISE EXCEPTION 'invalid reply sentiment';
  END IF;

  IF v_objection_category NOT IN (
    'none',
    'pricing',
    'timing',
    'trust',
    'data_privacy',
    'integration',
    'not_priority',
    'other'
  ) THEN
    RAISE EXCEPTION 'invalid objection category';
  END IF;

  IF v_usefulness_score IS NOT NULL AND (v_usefulness_score < 1 OR v_usefulness_score > 5) THEN
    RAISE EXCEPTION 'usefulness score must be between 1 and 5';
  END IF;

  RETURN QUERY
  UPDATE public.commercial_leads AS lead
  SET
    status = CASE
      WHEN p_unsubscribe_requested THEN 'archived'
      WHEN p_paid_pilot_signal THEN 'qualified'
      WHEN p_meeting_booked_at IS NOT NULL AND lead.status = 'new' THEN 'contacted'
      ELSE lead.status
    END,
    last_contacted_at = CASE
      WHEN p_replied_at IS NOT NULL THEN p_replied_at
      WHEN p_sample_report_sent_at IS NOT NULL THEN p_sample_report_sent_at
      ELSE lead.last_contacted_at
    END,
    metadata = jsonb_set(
      COALESCE(lead.metadata, '{}'::jsonb),
      '{outreach_response_metrics}',
      jsonb_strip_nulls(jsonb_build_object(
        'replied_at', p_replied_at,
        'reply_sentiment', v_reply_sentiment,
        'meeting_booked_at', p_meeting_booked_at,
        'sample_report_sent_at', p_sample_report_sent_at,
        'usefulness_score', v_usefulness_score,
        'objection_category', v_objection_category,
        'case_study_permission', p_case_study_permission,
        'paid_pilot_signal', p_paid_pilot_signal,
        'unsubscribe_requested', p_unsubscribe_requested,
        'response_notes', NULLIF(LEFT(COALESCE(p_response_notes, ''), 1000), ''),
        'updated_at', NOW(),
        'updated_by_user_id', auth.uid(),
        'commercial_launch_gate', true
      )),
      true
    ),
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

REVOKE ALL ON FUNCTION public.update_commercial_lead_response_metrics(
  UUID,
  TIMESTAMPTZ,
  TEXT,
  TIMESTAMPTZ,
  TIMESTAMPTZ,
  INTEGER,
  TEXT,
  BOOLEAN,
  BOOLEAN,
  BOOLEAN,
  TEXT
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.update_commercial_lead_response_metrics(
  UUID,
  TIMESTAMPTZ,
  TEXT,
  TIMESTAMPTZ,
  TIMESTAMPTZ,
  INTEGER,
  TEXT,
  BOOLEAN,
  BOOLEAN,
  BOOLEAN,
  TEXT
) TO authenticated;

COMMENT ON FUNCTION public.update_commercial_lead_response_metrics(
  UUID,
  TIMESTAMPTZ,
  TEXT,
  TIMESTAMPTZ,
  TIMESTAMPTZ,
  INTEGER,
  TEXT,
  BOOLEAN,
  BOOLEAN,
  BOOLEAN,
  TEXT
) IS 'Staff-only commercial outreach response metrics update. Stores reply, meeting, objection, usefulness, paid-signal, case-study, unsubscribe, and response-note metadata on commercial_leads.metadata for founder-led pilot learning.';
