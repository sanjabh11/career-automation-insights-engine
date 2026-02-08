-- Fix numeric overflow in onet_knowledge and onet_abilities tables
-- O*NET importance/level values are 0-100, not 0.00-9.99

-- Update onet_knowledge
ALTER TABLE onet_knowledge
  ALTER COLUMN level TYPE numeric(5,2),
  ALTER COLUMN importance TYPE numeric(5,2);

-- Update onet_abilities  
ALTER TABLE onet_abilities
  ALTER COLUMN level TYPE numeric(5,2),
  ALTER COLUMN importance TYPE numeric(5,2);

-- Add comments
COMMENT ON COLUMN onet_knowledge.level IS 'Level value from O*NET (0-100 scale)';
COMMENT ON COLUMN onet_knowledge.importance IS 'Importance value from O*NET (0-100 scale)';
COMMENT ON COLUMN onet_abilities.level IS 'Level value from O*NET (0-100 scale)';
COMMENT ON COLUMN onet_abilities.importance IS 'Importance value from O*NET (0-100 scale)';
