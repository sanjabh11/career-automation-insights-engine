-- ============================================
-- Hot Technologies Seed Data (FINAL FIX)
-- trending_score MUST be < 1.0 (precision 3, scale 2)
-- ============================================

-- Insert/Update Hot Technologies with correct decimal values
INSERT INTO onet_hot_technologies_master (technology_name, category, trending_score, related_occupations_count, description)
VALUES 
  ('Python', 'Programming Languages', 0.95, 150, 'High-level programming language for data science, web development, and automation'),
  ('JavaScript', 'Programming Languages', 0.92, 140, 'Core language for web development and full-stack applications'),
  ('SQL', 'Database', 0.90, 180, 'Standard language for database management and querying'),
  ('AWS', 'Cloud Computing', 0.88, 120, 'Amazon Web Services cloud platform'),
  ('React', 'Web Frameworks', 0.85, 100, 'JavaScript library for building user interfaces'),
  ('Docker', 'DevOps', 0.83, 90, 'Containerization platform for application deployment'),
  ('Kubernetes', 'DevOps', 0.80, 75, 'Container orchestration system'),
  ('Tableau', 'Data Visualization', 0.78, 85, 'Business intelligence and analytics platform'),
  ('Power BI', 'Data Visualization', 0.76, 80, 'Microsoft business analytics service'),
  ('Salesforce', 'CRM', 0.75, 95, 'Customer relationship management platform'),
  ('Azure', 'Cloud Computing', 0.74, 110, 'Microsoft cloud computing platform'),
  ('TensorFlow', 'Machine Learning', 0.72, 60, 'Open-source machine learning framework'),
  ('PyTorch', 'Machine Learning', 0.70, 55, 'Machine learning library for Python'),
  ('Git', 'Version Control', 0.85, 160, 'Distributed version control system'),
  ('Jenkins', 'CI/CD', 0.68, 70, 'Automation server for continuous integration'),
  ('Ansible', 'DevOps', 0.66, 65, 'IT automation and configuration management'),
  ('Terraform', 'Infrastructure', 0.65, 60, 'Infrastructure as code software tool'),
  ('MongoDB', 'Database', 0.72, 90, 'NoSQL document database'),
  ('PostgreSQL', 'Database', 0.75, 100, 'Advanced open-source relational database'),
  ('Redis', 'Database', 0.68, 75, 'In-memory data structure store'),
  ('Node.js', 'Runtime', 0.82, 120, 'JavaScript runtime built on Chrome V8'),
  ('TypeScript', 'Programming Languages', 0.80, 95, 'Typed superset of JavaScript'),
  ('Go', 'Programming Languages', 0.70, 70, 'Statically typed compiled programming language'),
  ('Rust', 'Programming Languages', 0.65, 50, 'Systems programming language focused on safety'),
  ('Java', 'Programming Languages', 0.88, 170, 'Object-oriented programming language'),
  ('C++', 'Programming Languages', 0.75, 110, 'General-purpose programming language'),
  ('R', 'Programming Languages', 0.72, 80, 'Statistical computing and graphics language'),
  ('Spark', 'Big Data', 0.70, 65, 'Unified analytics engine for large-scale data processing'),
  ('Hadoop', 'Big Data', 0.68, 70, 'Framework for distributed storage and processing'),
  ('Kafka', 'Streaming', 0.72, 60, 'Distributed event streaming platform'),
  ('Elasticsearch', 'Search Engine', 0.70, 75, 'Distributed search and analytics engine'),
  ('GraphQL', 'API', 0.68, 65, 'Query language for APIs'),
  ('REST API', 'API', 0.85, 150, 'Architectural style for distributed systems'),
  ('Microservices', 'Architecture', 0.75, 90, 'Architectural style for building applications'),
  ('Agile', 'Methodology', 0.80, 140, 'Iterative approach to project management'),
  ('Scrum', 'Methodology', 0.78, 130, 'Framework for agile project management'),
  ('JIRA', 'Project Management', 0.76, 120, 'Issue and project tracking software'),
  ('Figma', 'Design', 0.74, 70, 'Collaborative interface design tool'),
  ('Adobe Creative Suite', 'Design', 0.72, 85, 'Collection of graphic design applications'),
  ('Excel', 'Productivity', 0.90, 200, 'Spreadsheet software for data analysis')
ON CONFLICT (technology_name) DO UPDATE SET
  category = EXCLUDED.category,
  trending_score = EXCLUDED.trending_score,
  related_occupations_count = EXCLUDED.related_occupations_count,
  description = EXCLUDED.description;

-- Verify
SELECT 
  'Hot Technologies Seeded' as status,
  COUNT(*) as tech_count 
FROM onet_hot_technologies_master;
