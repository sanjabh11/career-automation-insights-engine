-- Adds O*NET 30.3 Task Ratings metadata needed to move proof-pack task
-- prioritization beyond seed-score proxies after a verified data ingest.

ALTER TABLE public.onet_detailed_tasks
  ADD COLUMN IF NOT EXISTS onet_release_version TEXT,
  ADD COLUMN IF NOT EXISTS relevance_value NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS relevance_n INTEGER,
  ADD COLUMN IF NOT EXISTS relevance_standard_error NUMERIC(7,4),
  ADD COLUMN IF NOT EXISTS relevance_lower_ci_bound NUMERIC(7,4),
  ADD COLUMN IF NOT EXISTS relevance_upper_ci_bound NUMERIC(7,4),
  ADD COLUMN IF NOT EXISTS relevance_recommend_suppress TEXT,
  ADD COLUMN IF NOT EXISTS relevance_date TEXT,
  ADD COLUMN IF NOT EXISTS relevance_domain_source TEXT,
  ADD COLUMN IF NOT EXISTS importance_n INTEGER,
  ADD COLUMN IF NOT EXISTS importance_standard_error NUMERIC(7,4),
  ADD COLUMN IF NOT EXISTS importance_lower_ci_bound NUMERIC(7,4),
  ADD COLUMN IF NOT EXISTS importance_upper_ci_bound NUMERIC(7,4),
  ADD COLUMN IF NOT EXISTS importance_recommend_suppress TEXT,
  ADD COLUMN IF NOT EXISTS importance_date TEXT,
  ADD COLUMN IF NOT EXISTS importance_domain_source TEXT,
  ADD COLUMN IF NOT EXISTS frequency_category INTEGER,
  ADD COLUMN IF NOT EXISTS frequency_percent NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS frequency_n INTEGER,
  ADD COLUMN IF NOT EXISTS frequency_standard_error NUMERIC(7,4),
  ADD COLUMN IF NOT EXISTS frequency_lower_ci_bound NUMERIC(7,4),
  ADD COLUMN IF NOT EXISTS frequency_upper_ci_bound NUMERIC(7,4),
  ADD COLUMN IF NOT EXISTS frequency_recommend_suppress TEXT,
  ADD COLUMN IF NOT EXISTS frequency_date TEXT,
  ADD COLUMN IF NOT EXISTS frequency_domain_source TEXT,
  ADD COLUMN IF NOT EXISTS task_ratings_ingested_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_detailed_tasks_importance
  ON public.onet_detailed_tasks(importance DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_detailed_tasks_frequency_category
  ON public.onet_detailed_tasks(frequency_category);

COMMENT ON COLUMN public.onet_detailed_tasks.onet_release_version
  IS 'O*NET database release used for this task statement/rating ingest, for example 30.3.';

COMMENT ON COLUMN public.onet_detailed_tasks.relevance_value
  IS 'O*NET Task Ratings RT data value; relevance of task for the occupation, 0-100.';

COMMENT ON COLUMN public.onet_detailed_tasks.importance
  IS 'O*NET Task Ratings IM data value where ingested; importance of task for the occupation, 1-5.';

COMMENT ON COLUMN public.onet_detailed_tasks.frequency_category
  IS 'Dominant O*NET Task Ratings FT category selected by highest percent frequency.';

COMMENT ON COLUMN public.onet_detailed_tasks.frequency
  IS 'Human-readable O*NET Task Categories label for frequency_category when Task Ratings are ingested.';

COMMENT ON COLUMN public.onet_detailed_tasks.frequency_percent
  IS 'Percent value for the dominant O*NET Task Ratings FT frequency category.';
