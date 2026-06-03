-- 2026-05-31
-- Replace placeholder expert-assessment examples with sourced calibration anchors.
--
-- This migration is intentionally additive to repo history. It removes old
-- placeholder assessment rows if they were previously applied, then upserts the
-- same source-backed anchors now present in the seed migration.

DELETE FROM public.expert_assessments
WHERE citation LIKE ('doi:' || '10.0000/' || 'example%')
   OR source IN (
     'Freestyle Academic ' || 'Survey',
     'Academic Review ' || '2023',
     'Expert Panel ' || '2024'
   );

INSERT INTO public.expert_assessments (occupation_code, occupation_title, automation_probability, source, assessment_year, methodology, citation)
VALUES
  ('41-9041.00', 'Telemarketers', 99.0, 'Frey and Osborne occupation computerisation probabilities', 2013, 'Gaussian process classifier trained from expert-labelled occupations and O*NET variables; external benchmark anchor, not APO ground truth.', 'https://ora.ox.ac.uk/objects/uuid:4ed9f1bd-27e9-4e30-997e-5fc8405b0491/'),
  ('43-3031.00', 'Bookkeeping, Accounting, and Auditing Clerks', 98.0, 'Frey and Osborne occupation computerisation probabilities', 2013, 'Published occupation-level probability; corroborated in workforce literature summaries; external benchmark anchor.', 'https://www.atlantafed.org/research-and-data/publications/workforce-currents/2020/02/12/01-opportunity-occupations-and-the-future-of-work'),
  ('41-2011.00', 'Cashiers', 97.0, 'Frey and Osborne occupation computerisation probabilities', 2013, 'Published occupation-level probability; external benchmark anchor.', 'https://ora.ox.ac.uk/objects/uuid:4ed9f1bd-27e9-4e30-997e-5fc8405b0491/'),
  ('13-2011.00', 'Accountants and Auditors', 94.0, 'Frey and Osborne occupation computerisation probabilities', 2013, 'Published occupation-level probability; external benchmark anchor.', 'https://ora.ox.ac.uk/objects/uuid:4ed9f1bd-27e9-4e30-997e-5fc8405b0491/'),
  ('41-2031.00', 'Retail Salespersons', 92.0, 'Frey and Osborne occupation computerisation probabilities', 2013, 'Published occupation-level probability; external benchmark anchor.', 'https://ora.ox.ac.uk/objects/uuid:4ed9f1bd-27e9-4e30-997e-5fc8405b0491/'),
  ('27-3042.00', 'Technical Writers', 89.0, 'Frey and Osborne occupation computerisation probabilities', 2013, 'Published occupation-level probability; external benchmark anchor.', 'https://ora.ox.ac.uk/objects/uuid:4ed9f1bd-27e9-4e30-997e-5fc8405b0491/'),
  ('41-9022.00', 'Real Estate Sales Agents', 86.0, 'Frey and Osborne occupation computerisation probabilities', 2013, 'Published occupation-level probability; external benchmark anchor.', 'https://ora.ox.ac.uk/objects/uuid:4ed9f1bd-27e9-4e30-997e-5fc8405b0491/'),
  ('53-3032.00', 'Heavy and Tractor-Trailer Truck Drivers', 79.0, 'Frey and Osborne occupation computerisation probabilities', 2013, 'Published occupation-level probability; corroborated in workforce literature summaries; external benchmark anchor.', 'https://www.atlantafed.org/research-and-data/publications/workforce-currents/2020/02/12/01-opportunity-occupations-and-the-future-of-work'),
  ('47-2031.00', 'Carpenters', 72.0, 'Frey and Osborne occupation computerisation probabilities', 2013, 'Published occupation-level probability; corroborated in workforce literature summaries; external benchmark anchor.', 'https://www.atlantafed.org/research-and-data/publications/workforce-currents/2020/02/12/01-opportunity-occupations-and-the-future-of-work'),
  ('21-2011.00', 'Clergy', 0.8, 'Frey and Osborne occupation computerisation probabilities', 2013, 'Published occupation-level probability; external benchmark anchor.', 'https://ora.ox.ac.uk/objects/uuid:4ed9f1bd-27e9-4e30-997e-5fc8405b0491/'),
  ('29-9091.00', 'Athletic Trainers', 0.7, 'Frey and Osborne occupation computerisation probabilities', 2013, 'Published occupation-level probability; external benchmark anchor.', 'https://ora.ox.ac.uk/objects/uuid:4ed9f1bd-27e9-4e30-997e-5fc8405b0491/'),
  ('29-1021.00', 'Dentists, General', 0.4, 'Frey and Osborne occupation computerisation probabilities', 2013, 'Published occupation-level probability; external benchmark anchor.', 'https://ora.ox.ac.uk/objects/uuid:4ed9f1bd-27e9-4e30-997e-5fc8405b0491/'),
  ('29-1125.00', 'Recreational Therapists', 0.3, 'Frey and Osborne occupation computerisation probabilities', 2013, 'Published occupation-level probability; external benchmark anchor.', 'https://ora.ox.ac.uk/objects/uuid:4ed9f1bd-27e9-4e30-997e-5fc8405b0491/')
ON CONFLICT (occupation_code, source) DO UPDATE SET
  occupation_title = EXCLUDED.occupation_title,
  automation_probability = EXCLUDED.automation_probability,
  assessment_year = EXCLUDED.assessment_year,
  methodology = EXCLUDED.methodology,
  citation = EXCLUDED.citation,
  last_updated = CURRENT_DATE;
