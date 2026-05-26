-- Staff-only outreach pipeline metadata for commercial proof-pack leads.
-- This keeps campaign state in commercial_leads.metadata so the existing lead
-- table and report artifact relationships remain backward compatible.

CREATE OR REPLACE FUNCTION public.update_commercial_lead_outreach_plan(
  p_lead_id UUID,
  p_outreach_stage TEXT,
  p_outreach_channel TEXT DEFAULT 'email',
  p_priority TEXT DEFAULT 'medium',
  p_next_follow_up_at TIMESTAMPTZ DEFAULT NULL,
  p_sequence_step INTEGER DEFAULT 0,
  p_next_action TEXT DEFAULT NULL,
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
DECLARE
  v_stage TEXT := lower(trim(coalesce(p_outreach_stage, '')));
  v_channel TEXT := lower(trim(coalesce(p_outreach_channel, 'email')));
  v_priority TEXT := lower(trim(coalesce(p_priority, 'medium')));
  v_sequence_step INTEGER := greatest(coalesce(p_sequence_step, 0), 0);
BEGIN
  IF NOT public.is_commercial_staff() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF v_stage NOT IN (
    'not_started',
    'research_ready',
    'first_touch_sent',
    'follow_up_scheduled',
    'pilot_qualified',
    'paid_converted',
    'nurture_paused'
  ) THEN
    RAISE EXCEPTION 'invalid outreach stage';
  END IF;

  IF v_channel NOT IN ('linkedin', 'email', 'warm_intro', 'webinar', 'phone', 'other') THEN
    RAISE EXCEPTION 'invalid outreach channel';
  END IF;

  IF v_priority NOT IN ('urgent', 'high', 'medium', 'low') THEN
    RAISE EXCEPTION 'invalid outreach priority';
  END IF;

  RETURN QUERY
  UPDATE public.commercial_leads AS lead
  SET
    status = CASE
      WHEN v_stage IN ('first_touch_sent', 'follow_up_scheduled') THEN 'contacted'
      WHEN v_stage = 'pilot_qualified' THEN 'qualified'
      WHEN v_stage = 'paid_converted' THEN 'converted'
      WHEN v_stage = 'nurture_paused' THEN 'archived'
      ELSE lead.status
    END,
    staff_notes = CASE
      WHEN p_staff_notes IS NULL THEN lead.staff_notes
      ELSE NULLIF(LEFT(COALESCE(p_staff_notes, ''), 2000), '')
    END,
    last_contacted_at = CASE
      WHEN v_stage IN ('first_touch_sent', 'follow_up_scheduled', 'pilot_qualified', 'paid_converted') THEN NOW()
      ELSE lead.last_contacted_at
    END,
    metadata = jsonb_set(
      COALESCE(lead.metadata, '{}'::jsonb),
      '{outreach_pipeline}',
      jsonb_strip_nulls(jsonb_build_object(
        'stage', v_stage,
        'channel', v_channel,
        'priority', v_priority,
        'next_follow_up_at', p_next_follow_up_at,
        'sequence_step', v_sequence_step,
        'next_action', NULLIF(LEFT(COALESCE(p_next_action, ''), 500), ''),
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

REVOKE ALL ON FUNCTION public.update_commercial_lead_outreach_plan(UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, INTEGER, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_commercial_lead_outreach_plan(UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, INTEGER, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION public.update_commercial_lead_outreach_plan(UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, INTEGER, TEXT, TEXT)
IS 'Staff-only commercial outreach pipeline update. Stores campaign stage, channel, priority, next action, and follow-up metadata on commercial_leads.metadata without exposing report artifacts.';
