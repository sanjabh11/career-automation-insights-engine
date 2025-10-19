-- Migration: add unique index on descriptor_families.slug for deterministic upserts
-- Safe to run multiple times
create unique index if not exists ux_descriptor_families_slug
  on public.descriptor_families (slug);
