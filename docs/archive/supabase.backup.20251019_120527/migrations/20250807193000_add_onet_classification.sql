-- Migration: Add O*NET classification, descriptor, and crosswalk tables
-- Generated 2025-08-07

-- 1. Reference Tables -------------------------------------------------------
create table if not exists job_zones (
  id smallint primary key,
  name text not null
);

create table if not exists bright_outlook_flags (
  id smallint primary key,
  slug text unique not null,
  description text not null
);

create table if not exists stem_categories (
  id smallint primary key,
  name text not null
);

create table if not exists career_clusters (
  id smallint primary key,
  name text not null
);

create table if not exists industries (
  id integer primary key,
  naics_code text unique not null,
  name text not null
);

-- Occupation master table if not yet present (safety)
create table if not exists occupations (
  onet_code text primary key,
  title text not null
);

-- 2. Occupation ⇄ Classification ------------------------------------------
create table if not exists occupation_classifications (
  onet_code text references occupations(onet_code) on delete cascade,
  job_zone smallint references job_zones(id),
  bright_outlook smallint references bright_outlook_flags(id),
  stem_category smallint references stem_categories(id),
  career_cluster smallint references career_clusters(id),
  industry_id integer references industries(id),
  primary key (onet_code)
);

-- 3. Descriptor Families ---------------------------------------------------
create table if not exists descriptor_families (
  id serial primary key,
  slug text unique not null,
  name text not null
);

create table if not exists descriptors (
  id serial primary key,
  family_id int references descriptor_families(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  unique (family_id, code)
);

create table if not exists occupation_descriptors (
  onet_code text references occupations(onet_code) on delete cascade,
  descriptor_id int references descriptors(id) on delete cascade,
  importance numeric,
  level numeric,
  primary key (onet_code, descriptor_id)
);

-- 4. Crosswalks ------------------------------------------------------------
create table if not exists crosswalk_sources (
  id serial primary key,
  slug text unique not null,
  name text not null
);

create table if not exists occupation_crosswalks (
  crosswalk_source_id int references crosswalk_sources(id) on delete cascade,
  external_code text not null,
  onet_code text references occupations(onet_code) on delete cascade,
  primary key (crosswalk_source_id, external_code)
);

-- 5. Tool & Technology Taxonomy -------------------------------------------
create table if not exists tools_technology (
  id serial primary key,
  onet_code text references occupations(onet_code) on delete cascade,
  tool_name text not null,
  category text,
  unique (onet_code, tool_name)
);

-- 6. Green Economy & Apprenticeship Flags ---------------------------------
create table if not exists green_apprentice_flags (
  onet_code text references occupations(onet_code) on delete cascade primary key,
  is_green boolean not null default false,
  is_apprentice boolean not null default false
);
