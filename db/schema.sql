-- 观真六爻数据库初版
-- 目标：保存规则库、用户私有卦例、AI 解读与本地资料库索引。
-- Supabase/Postgres 版本；本地 SQLite 需要删去 uuid、jsonb、rls、vector 相关语句。

create extension if not exists pgcrypto;
create extension if not exists vector;

create table if not exists trigrams (
  name text primary key,
  element text not null,
  lines_bottom_to_top text not null check (length(lines_bottom_to_top) = 3)
);

create table if not exists hexagrams (
  key text primary key,
  name text not null,
  upper_trigram text not null references trigrams(name),
  lower_trigram text not null references trigrams(name),
  palace text not null references trigrams(name),
  palace_element text not null,
  palace_stage text not null,
  shi_line integer not null check (shi_line between 1 and 6),
  ying_line integer not null check (ying_line between 1 and 6)
);

create table if not exists najia_lines (
  trigram text not null references trigrams(name),
  side text not null check (side in ('inner', 'outer')),
  line_offset integer not null check (line_offset between 1 and 3),
  heavenly_stem text not null,
  earthly_branch text not null,
  primary key (trigram, side, line_offset)
);

create table if not exists interpretations (
  id bigint generated always as identity primary key,
  scope text not null,
  match_key text not null,
  title text not null,
  body text not null,
  source_note text,
  created_at timestamptz not null default now()
);

create unique index if not exists interpretations_scope_match_title_idx on interpretations(scope, match_key, title);

create table if not exists divinations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question text not null,
  topic text not null default 'general',
  method text not null,
  cast_at timestamptz,
  line_values smallint[] not null,
  original_name text not null,
  changed_name text not null,
  input_json jsonb not null,
  chart_json jsonb not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists divinations_user_created_idx on divinations(user_id, created_at desc);

create table if not exists ai_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  divination_id uuid references divinations(id) on delete cascade,
  provider text not null,
  model text not null,
  persona text not null,
  depth text not null,
  content text not null,
  prompt_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ai_readings_user_created_idx on ai_readings(user_id, created_at desc);

create table if not exists followups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  divination_id uuid not null references divinations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  round integer not null,
  created_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete set null,
  source_path text not null unique,
  title text not null,
  file_type text not null,
  sha256 text not null,
  byte_size bigint not null,
  extracted_chars integer not null default 0,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  token_estimate integer not null,
  embedding vector(1536),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(document_id, chunk_index)
);

create index if not exists document_chunks_document_idx on document_chunks(document_id, chunk_index);
create index if not exists document_chunks_embedding_idx on document_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

alter table divinations enable row level security;
alter table ai_readings enable row level security;
alter table followups enable row level security;
alter table documents enable row level security;
alter table document_chunks enable row level security;

create policy "users can read own divinations" on divinations
  for select using (auth.uid() = user_id and deleted_at is null);
create policy "users can insert own divinations" on divinations
  for insert with check (auth.uid() = user_id);
create policy "users can delete own divinations" on divinations
  for delete using (auth.uid() = user_id);

create policy "users can read own readings" on ai_readings
  for select using (auth.uid() = user_id);
create policy "users can insert own readings" on ai_readings
  for insert with check (auth.uid() = user_id);

create policy "users can read own followups" on followups
  for select using (auth.uid() = user_id);
create policy "users can insert own followups" on followups
  for insert with check (auth.uid() = user_id);

create policy "users can read public documents" on documents
  for select using (is_public or auth.uid() = owner_user_id);
create policy "service manages documents" on documents
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "users can read public chunks" on document_chunks
  for select using (
    exists (
      select 1 from documents
      where documents.id = document_chunks.document_id
      and (documents.is_public or documents.owner_user_id = auth.uid())
    )
  );
create policy "service manages chunks" on document_chunks
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create or replace function match_document_chunks(
  query_embedding vector(1536),
  match_count integer default 8,
  min_similarity float default 0.2
)
returns table (
  id uuid,
  document_id uuid,
  title text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    dc.id,
    dc.document_id,
    d.title,
    dc.content,
    1 - (dc.embedding <=> query_embedding) as similarity
  from document_chunks dc
  join documents d on d.id = dc.document_id
  where dc.embedding is not null
    and (1 - (dc.embedding <=> query_embedding)) >= min_similarity
    and (d.is_public or d.owner_user_id = auth.uid())
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;
);

-- ========== 激活密钥表 ==========
CREATE TABLE IF NOT EXISTS activation_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key_str VARCHAR(64) NOT NULL UNIQUE,
  modules VARCHAR(128) NOT NULL DEFAULT 'liuyao,ziwei',
  type TINYINT NOT NULL DEFAULT 1, -- 1=时长版, 2=次数版
  expire_days INT NOT NULL DEFAULT 365,
  remain_times INT NOT NULL DEFAULT -1, -- -1=不限次
  first_activate_time DATETIME DEFAULT NULL,
  status TINYINT NOT NULL DEFAULT 1, -- 1=启用, 0=禁用
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 插入测试密钥（时长版，365天，不限次）
INSERT OR IGNORE INTO activation_keys (key_str, modules, type, expire_days, remain_times, status)
VALUES ('GuanZhen2026-Demo-Key-001', 'liuyao,ziwei', 1, 365, -1, 1);
