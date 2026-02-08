-- Check actual table schemas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'onet_job_zones' 
ORDER BY ordinal_position;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'onet_career_clusters' 
ORDER BY ordinal_position;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'onet_hot_technologies_master' 
ORDER BY ordinal_position;
