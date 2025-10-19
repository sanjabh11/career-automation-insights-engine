-- ============================================
-- Seed Hot Technologies Master Data
-- ============================================
-- Purpose: Populate onet_hot_technologies_master with 40 trending technologies
-- Source: O*NET Hot Technology data + market analysis

-- Clear existing data (optional - remove if you want to preserve)
TRUNCATE TABLE onet_hot_technologies_master CASCADE;

-- Insert 40 hot technologies
INSERT INTO onet_hot_technologies_master (technology_name, category, description, related_occupations_count, trending_score)
VALUES
  -- Programming & Development
  ('Python', 'Programming Languages', 'High-level programming language for AI, data science, web development', 85, 0.98),
  ('JavaScript', 'Programming Languages', 'Web programming language for front-end and back-end development', 92, 0.95),
  ('Java', 'Programming Languages', 'Enterprise programming language for large-scale applications', 78, 0.88),
  ('SQL', 'Database', 'Structured Query Language for database management', 95, 0.92),
  ('React', 'Web Frameworks', 'JavaScript library for building user interfaces', 68, 0.94),
  ('Node.js', 'Runtime Environments', 'JavaScript runtime for server-side development', 72, 0.91),
  ('TypeScript', 'Programming Languages', 'Typed superset of JavaScript for large applications', 55, 0.89),
  ('C#', 'Programming Languages', '.NET programming language for Windows applications', 62, 0.82),
  ('C++', 'Programming Languages', 'High-performance programming language for systems', 58, 0.79),
  ('Go', 'Programming Languages', 'Modern language for cloud and distributed systems', 42, 0.87),
  
  -- Data & Analytics
  ('Excel', 'Spreadsheet Software', 'Microsoft spreadsheet application for data analysis', 120, 0.85),
  ('Tableau', 'Data Visualization', 'Business intelligence and analytics platform', 48, 0.90),
  ('Power BI', 'Data Visualization', 'Microsoft business analytics service', 52, 0.91),
  ('R', 'Statistical Software', 'Programming language for statistical computing', 38, 0.84),
  ('Apache Spark', 'Big Data', 'Unified analytics engine for large-scale data processing', 35, 0.86),
  ('Hadoop', 'Big Data', 'Framework for distributed storage and processing', 32, 0.78),
  
  -- Cloud & Infrastructure
  ('AWS', 'Cloud Platforms', 'Amazon Web Services cloud computing platform', 88, 0.96),
  ('Azure', 'Cloud Platforms', 'Microsoft cloud computing platform', 76, 0.93),
  ('Google Cloud', 'Cloud Platforms', 'Google cloud computing services', 65, 0.90),
  ('Docker', 'Containerization', 'Platform for developing and deploying containerized applications', 58, 0.92),
  ('Kubernetes', 'Container Orchestration', 'System for automating deployment and management of containers', 52, 0.93),
  ('Terraform', 'Infrastructure as Code', 'Tool for building and managing infrastructure', 38, 0.88),
  
  -- AI & Machine Learning
  ('TensorFlow', 'Machine Learning', 'Open-source platform for machine learning', 45, 0.94),
  ('PyTorch', 'Machine Learning', 'Machine learning framework for Python', 42, 0.93),
  ('Scikit-learn', 'Machine Learning', 'Machine learning library for Python', 40, 0.87),
  ('Keras', 'Deep Learning', 'High-level neural networks API', 35, 0.85),
  ('OpenAI API', 'AI Services', 'API for GPT and other AI models', 28, 0.97),
  
  -- CRM & Business Tools
  ('Salesforce', 'CRM', 'Customer relationship management platform', 75, 0.89),
  ('SAP', 'ERP', 'Enterprise resource planning software', 68, 0.83),
  ('Oracle', 'Database', 'Enterprise database management system', 72, 0.81),
  ('Microsoft Dynamics', 'ERP', 'Business applications and CRM platform', 55, 0.82),
  
  -- DevOps & Tools
  ('Git', 'Version Control', 'Distributed version control system', 95, 0.90),
  ('Jenkins', 'CI/CD', 'Automation server for continuous integration', 48, 0.84),
  ('Jira', 'Project Management', 'Issue and project tracking software', 82, 0.86),
  
  -- Security
  ('Splunk', 'Security Analytics', 'Platform for searching and analyzing machine data', 38, 0.87),
  ('Palo Alto Networks', 'Cybersecurity', 'Network security and firewall solutions', 32, 0.85),
  
  -- Design & Collaboration
  ('Figma', 'Design Tools', 'Collaborative interface design tool', 42, 0.91),
  ('Adobe Creative Suite', 'Design Tools', 'Professional creative software suite', 88, 0.84),
  ('Slack', 'Collaboration', 'Team communication and collaboration platform', 78, 0.88),
  ('Microsoft Teams', 'Collaboration', 'Unified communication and collaboration platform', 85, 0.87)
ON CONFLICT (technology_name) DO UPDATE SET
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  related_occupations_count = EXCLUDED.related_occupations_count,
  trending_score = EXCLUDED.trending_score,
  updated_at = NOW();

-- Verify
SELECT 'FINAL COUNTS' AS status, 'Hot Technologies' AS dataset, COUNT(*) AS count 
FROM onet_hot_technologies_master;
