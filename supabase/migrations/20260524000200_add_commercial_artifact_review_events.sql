-- Adds append-only proof-pack section review events for staff delivery readiness.

ALTER TABLE public.commercial_report_artifact_events
  DROP CONSTRAINT IF EXISTS commercial_report_artifact_events_event_type_check;

ALTER TABLE public.commercial_report_artifact_events
  ADD CONSTRAINT commercial_report_artifact_events_event_type_check
  CHECK (
    event_type IN (
      'staff_opened',
      'staff_downloaded',
      'staff_open_failed',
      'section_review_updated',
      'section_client_ready',
      'artifact_client_ready'
    )
  );

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

  IF p_event_type NOT IN (
    'staff_opened',
    'staff_downloaded',
    'staff_open_failed',
    'section_review_updated',
    'section_client_ready',
    'artifact_client_ready'
  ) THEN
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

COMMENT ON FUNCTION public.log_commercial_report_artifact_event(UUID, TEXT, UUID, TEXT, JSONB)
  IS 'Staff-only append endpoint for artifact delivery and proof-pack section review readiness events.';
