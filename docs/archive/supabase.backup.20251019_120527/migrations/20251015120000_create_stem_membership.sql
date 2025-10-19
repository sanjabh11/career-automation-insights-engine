-- Create STEM membership table based on O*NET official STEM list
-- Reference: https://services.onetcenter.org/ws/online/stem

CREATE TABLE IF NOT EXISTS onet_stem_membership (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occupation_code text NOT NULL UNIQUE,
  stem_occupation_type text, -- e.g., "Research, Design, or Development", "Applied Engineering", etc.
  stem_occupation_type_code text, -- Type code from O*NET
  job_family text, -- Job family within the STEM type
  is_official_stem boolean DEFAULT true,
  data_source text DEFAULT 'O*NET STEM Browse',
  last_synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_stem_membership_occupation_code ON onet_stem_membership(occupation_code);
CREATE INDEX IF NOT EXISTS idx_stem_membership_type ON onet_stem_membership(stem_occupation_type_code);

-- Add comment
COMMENT ON TABLE onet_stem_membership IS 'Official STEM occupation membership from O*NET Browse STEM occupations endpoint';

-- Enable RLS
ALTER TABLE onet_stem_membership ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Allow public read access to STEM membership"
  ON onet_stem_membership
  FOR SELECT
  TO public
  USING (true);
