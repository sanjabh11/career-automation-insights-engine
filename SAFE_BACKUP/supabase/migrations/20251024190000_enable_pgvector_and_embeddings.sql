begin;

create extension if not exists vector;

create table if not exists onet_duty_embeddings (
  task_id text primary key,
  occupation_code text not null,
  content text not null,
  embedding vector(768),
  updated_at timestamptz default now()
);

create index if not exists onet_duty_embeddings_occ_idx on onet_duty_embeddings(occupation_code);
create index if not exists onet_duty_embeddings_updated_idx on onet_duty_embeddings(updated_at);
create index if not exists onet_duty_embeddings_embedding_idx on onet_duty_embeddings using ivfflat (embedding vector_l2_ops) with (lists = 100);

create table if not exists onet_activity_embeddings (
  activity_id text primary key,
  occupation_code text not null,
  content text not null,
  embedding vector(768),
  updated_at timestamptz default now()
);

create index if not exists onet_activity_embeddings_occ_idx on onet_activity_embeddings(occupation_code);
create index if not exists onet_activity_embeddings_updated_idx on onet_activity_embeddings(updated_at);
create index if not exists onet_activity_embeddings_embedding_idx on onet_activity_embeddings using ivfflat (embedding vector_l2_ops) with (lists = 100);

commit;
