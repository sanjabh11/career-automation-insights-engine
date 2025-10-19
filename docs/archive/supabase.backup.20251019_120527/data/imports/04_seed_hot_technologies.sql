-- ============================================
-- Hot Technologies Seed Data
-- Curated list of trending technologies
-- ============================================

INSERT INTO onet_hot_technologies_master (technology_name, category, trending_score, related_occupations_count, description)
VALUES 
  ('Python', 'Programming Languages', 95, 150, 'High-level programming language for data science, web development, and automation'),
  ('JavaScript', 'Programming Languages', 92, 140, 'Core language for web development and full-stack applications'),
  ('SQL', 'Database', 90, 180, 'Standard language for database management and querying'),
  ('AWS', 'Cloud Computing', 88, 120, 'Amazon Web Services cloud platform'),
  ('React', 'Web Frameworks', 85, 100, 'JavaScript library for building user interfaces'),
  ('Docker', 'DevOps', 83, 90, 'Containerization platform for application deployment'),
  ('Kubernetes', 'DevOps', 80, 75, 'Container orchestration system'),
  ('Tableau', 'Data Visualization', 78, 85, 'Business intelligence and analytics platform'),
  ('Power BI', 'Data Visualization', 76, 80, 'Microsoft business analytics service'),
  ('Salesforce', 'CRM', 75, 95, 'Customer relationship management platform'),
  ('Azure', 'Cloud Computing', 74, 110, 'Microsoft cloud computing platform'),
  ('TensorFlow', 'Machine Learning', 72, 60, 'Open-source machine learning framework'),
  ('PyTorch', 'Machine Learning', 70, 55, 'Machine learning library for Python'),
  ('Git', 'Version Control', 85, 160, 'Distributed version control system'),
  ('Jenkins', 'CI/CD', 68, 70, 'Automation server for continuous integration'),
  ('Ansible', 'DevOps', 66, 65, 'IT automation and configuration management'),
  ('Terraform', 'Infrastructure', 65, 60, 'Infrastructure as code software tool'),
  ('MongoDB', 'Database', 72, 90, 'NoSQL document database'),
  ('PostgreSQL', 'Database', 75, 100, 'Advanced open-source relational database'),
  ('Redis', 'Database', 68, 75, 'In-memory data structure store'),
  ('Node.js', 'Runtime', 82, 120, 'JavaScript runtime built on Chrome V8'),
  ('TypeScript', 'Programming Languages', 80, 95, 'Typed superset of JavaScript'),
  ('Go', 'Programming Languages', 70, 70, 'Statically typed compiled programming language'),
  ('Rust', 'Programming Languages', 65, 50, 'Systems programming language focused on safety'),
  ('Java', 'Programming Languages', 88, 170, 'Object-oriented programming language'),
  ('C++', 'Programming Languages', 75, 110, 'General-purpose programming language'),
  ('R', 'Programming Languages', 72, 80, 'Statistical computing and graphics language'),
  ('Spark', 'Big Data', 70, 65, 'Unified analytics engine for large-scale data processing'),
  ('Hadoop', 'Big Data', 68, 70, 'Framework for distributed storage and processing'),
  ('Kafka', 'Streaming', 72, 60, 'Distributed event streaming platform'),
  ('Elasticsearch', 'Search Engine', 70, 75, 'Distributed search and analytics engine'),
  ('GraphQL', 'API', 68, 65, 'Query language for APIs'),
  ('REST API', 'API', 85, 150, 'Architectural style for distributed systems'),
  ('Microservices', 'Architecture', 75, 90, 'Architectural style for building applications'),
  ('Agile', 'Methodology', 80, 140, 'Iterative approach to project management'),
  ('Scrum', 'Methodology', 78, 130, 'Framework for agile project management'),
  ('JIRA', 'Project Management', 76, 120, 'Issue and project tracking software'),
  ('Figma', 'Design', 74, 70, 'Collaborative interface design tool'),
  ('Adobe Creative Suite', 'Design', 72, 85, 'Collection of graphic design applications'),
  ('Excel', 'Productivity', 90, 200, 'Spreadsheet software for data analysis')
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
