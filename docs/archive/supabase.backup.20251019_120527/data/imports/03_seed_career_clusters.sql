-- ============================================
-- Career Clusters Seed Data (16 clusters)
-- Based on National Career Clusters Framework
-- ============================================

INSERT INTO onet_career_clusters (cluster_id, cluster_title, description, sort_order)
VALUES 
  ('it', 'Information Technology', 'Building linkages in IT occupations for entry level, technical, and professional careers related to the design, development, support, and management of hardware, software, multimedia, and systems integration services.', 1),
  ('health', 'Health Science', 'Planning, managing, and providing therapeutic services, diagnostic services, health informatics, support services, and biotechnology research and development.', 2),
  ('eng', 'Engineering & Manufacturing', 'Planning, managing, and performing the processing of materials into intermediate or final products and related professional and technical support activities.', 3),
  ('finance', 'Finance', 'Planning, services for financial and investment planning, banking, insurance, and business financial management.', 4),
  ('business', 'Business Management & Administration', 'Planning, organizing, directing, and evaluating business functions essential to efficient and productive business operations.', 5),
  ('edu', 'Education & Training', 'Planning, managing, and providing education and training services, and related learning support services.', 6),
  ('public', 'Government & Public Administration', 'Executing governmental functions at the local, state, and federal levels, including governance, national security, foreign service, planning, revenue and taxation, and regulations.', 7),
  ('law', 'Law, Public Safety, Corrections & Security', 'Planning, managing, and providing legal, public safety, protective services, and homeland security, including professional and technical support services.', 8),
  ('agri', 'Agriculture, Food & Natural Resources', 'Production, processing, marketing, distribution, financing, and development of agricultural commodities and resources.', 9),
  ('arts', 'Arts, Audio/Video Technology & Communications', 'Designing, producing, exhibiting, performing, writing, and publishing multimedia content including visual and performing arts and design, journalism, and entertainment services.', 10),
  ('arch', 'Architecture & Construction', 'Designing, planning, managing, building, and maintaining the built environment.', 11),
  ('hosp', 'Hospitality & Tourism', 'Encompassing the management, marketing, and operations of restaurants and other food services, lodging, attractions, recreation events, and travel related services.', 12),
  ('hr', 'Human Services', 'Preparing individuals for employment in career pathways that relate to families and human needs.', 13),
  ('trans', 'Transportation, Distribution & Logistics', 'Planning, management, and movement of people, materials, and goods by road, pipeline, air, rail, and water.', 14),
  ('mktg', 'Marketing', 'Planning, managing, and performing marketing activities to reach organizational objectives.', 15),
  ('sci', 'Science, Technology, Engineering & Mathematics', 'Planning, managing, and providing scientific research and professional and technical services including laboratory and testing services, and research and development services.', 16)
ON CONFLICT (cluster_id) DO UPDATE SET
  cluster_title = EXCLUDED.cluster_title,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- Verify
SELECT 
  'Career Clusters Seeded' as status,
  COUNT(*) as cluster_count 
FROM onet_career_clusters;
