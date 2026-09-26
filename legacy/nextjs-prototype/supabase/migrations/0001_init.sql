-- IP Ebenézer Taubaté — schema inicial
-- Traduz para SQL o modelo descrito em spec-tecnica.md (seção 2 e 3).
-- Rode com: npx supabase db push  (ou cole no SQL Editor do painel do Supabase)

create extension if not exists pgcrypto;

-- =========================================================================
-- MEMBROS E EBD
-- =========================================================================

create table members (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid references auth.users(id),
  full_name     text not null,
  birth_date    date,
  role          text not null check (role in ('pastor','lider','membro','visitante')) default 'membro',
  phone         text,
  photo_url     text,
  email         text,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

create table ebd_classes (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  teacher_id    uuid references members(id),
  description   text,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

create table class_members (
  id            uuid primary key default gen_random_uuid(),
  class_id      uuid not null references ebd_classes(id) on delete cascade,
  member_id     uuid not null references members(id) on delete cascade,
  unique (class_id, member_id)
);

create table attendance_sessions (
  id            uuid primary key default gen_random_uuid(),
  class_id      uuid not null references ebd_classes(id),
  session_date  date not null,
  notes         text,
  created_by    uuid references members(id),
  created_at    timestamptz not null default now(),
  unique (class_id, session_date)
);

create table attendance_records (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references attendance_sessions(id) on delete cascade,
  member_id     uuid not null references members(id),
  present       boolean not null default false
);

-- =========================================================================
-- COMUNICAÇÃO E EVENTOS
-- =========================================================================

create table bulletin_posts (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  body          text,
  image_url     text,
  published_at  timestamptz not null default now(),
  author_id     uuid references members(id),
  pinned        boolean not null default false
);

create table events (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  event_type    text not null check (event_type in ('culto','congresso','reuniao','aniversario','outro')),
  starts_at     timestamptz not null,
  ends_at       timestamptz,
  location      text,
  created_by    uuid references members(id)
);

-- =========================================================================
-- CULTOS E ESCALA DE LOUVOR
-- =========================================================================

create table services (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  service_type  text,
  scheduled_at  timestamptz not null,
  theme         text,
  preacher_id   uuid references members(id),
  notes         text,
  created_at    timestamptz not null default now()
);

create table worship_team_roles (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid not null references members(id),
  function      text not null check (function in ('vocal','instrumentista','som','midia')),
  instrument    text,
  active        boolean not null default true,
  unique (member_id)
);

create table worship_scales (
  id            uuid primary key default gen_random_uuid(),
  service_id    uuid not null references services(id) on delete cascade,
  name          text not null,
  notes         text,
  created_by    uuid references members(id),
  created_at    timestamptz not null default now()
);

create table worship_scale_slots (
  id            uuid primary key default gen_random_uuid(),
  scale_id      uuid not null references worship_scales(id) on delete cascade,
  member_id     uuid not null references members(id),
  function      text not null check (function in ('vocal','instrumentista','som','midia')),
  confirmed     boolean
);

create table songs (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  artist        text,
  key           text,
  lyrics_url    text,
  chords_url    text,
  audio_url     text,
  notes         text,
  created_by    uuid references members(id),
  created_at    timestamptz not null default now()
);

create table song_voice_parts (
  id            uuid primary key default gen_random_uuid(),
  song_id       uuid not null references songs(id) on delete cascade,
  voice_type    text not null check (voice_type in ('soprano','contralto','tenor','baixo','geral')),
  audio_url     text,
  notes         text
);

create table scale_songs (
  id            uuid primary key default gen_random_uuid(),
  scale_id      uuid not null references worship_scales(id) on delete cascade,
  song_id       uuid not null references songs(id),
  order_index   int not null default 0,
  notes         text
);

-- =========================================================================
-- HELPERS DE PERMISSÃO
-- Um usuário autenticado (auth.uid()) enxerga seu próprio registro em `members`
-- via auth_user_id. As funções abaixo isolam essa checagem para as policies.
-- =========================================================================

create or replace function current_member_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from members where auth_user_id = auth.uid();
$$;

create or replace function is_leader()
returns boolean
language sql
stable
as $$
  select current_member_role() in ('pastor', 'lider');
$$;

create or replace function current_member_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from members where auth_user_id = auth.uid();
$$;

-- =========================================================================
-- ROW LEVEL SECURITY
-- Traduz a matriz de permissões do spec-tecnica.md (seção 3).
-- =========================================================================

alter table members enable row level security;
alter table ebd_classes enable row level security;
alter table class_members enable row level security;
alter table attendance_sessions enable row level security;
alter table attendance_records enable row level security;
alter table bulletin_posts enable row level security;
alter table events enable row level security;
alter table services enable row level security;
alter table worship_team_roles enable row level security;
alter table worship_scales enable row level security;
alter table worship_scale_slots enable row level security;
alter table songs enable row level security;
alter table song_voice_parts enable row level security;
alter table scale_songs enable row level security;

-- Membros: todo usuário autenticado lê; só líder/pastor gerencia (criar, editar).
create policy "members_select_authenticated" on members
  for select using (auth.role() = 'authenticated');
create policy "members_write_leader" on members
  for all using (is_leader()) with check (is_leader());

-- EBD: leitura geral, escrita restrita a líder/pastor.
create policy "ebd_classes_select" on ebd_classes for select using (auth.role() = 'authenticated');
create policy "ebd_classes_write_leader" on ebd_classes for all using (is_leader()) with check (is_leader());

create policy "class_members_select" on class_members for select using (auth.role() = 'authenticated');
create policy "class_members_write_leader" on class_members for all using (is_leader()) with check (is_leader());

create policy "attendance_sessions_select" on attendance_sessions for select using (auth.role() = 'authenticated');
create policy "attendance_sessions_write_leader" on attendance_sessions for all using (is_leader()) with check (is_leader());

create policy "attendance_records_select" on attendance_records for select using (auth.role() = 'authenticated');
create policy "attendance_records_write_leader" on attendance_records for all using (is_leader()) with check (is_leader());

-- Boletim e eventos: leitura geral (inclusive visitante), escrita líder/pastor.
create policy "bulletin_posts_select_all" on bulletin_posts for select using (true);
create policy "bulletin_posts_write_leader" on bulletin_posts for all using (is_leader()) with check (is_leader());

create policy "events_select_all" on events for select using (true);
create policy "events_write_leader" on events for all using (is_leader()) with check (is_leader());

-- Cultos e escalas: leitura geral p/ autenticados, escrita líder/pastor.
create policy "services_select" on services for select using (auth.role() = 'authenticated');
create policy "services_write_leader" on services for all using (is_leader()) with check (is_leader());

create policy "worship_team_roles_select" on worship_team_roles for select using (auth.role() = 'authenticated');
create policy "worship_team_roles_write_leader" on worship_team_roles for all using (is_leader()) with check (is_leader());

create policy "worship_scales_select" on worship_scales for select using (auth.role() = 'authenticated');
create policy "worship_scales_write_leader" on worship_scales for all using (is_leader()) with check (is_leader());

-- Slots de escala: o próprio músico pode confirmar/recusar sua vaga.
create policy "worship_scale_slots_select" on worship_scale_slots for select using (auth.role() = 'authenticated');
create policy "worship_scale_slots_write_leader" on worship_scale_slots for all using (is_leader()) with check (is_leader());
create policy "worship_scale_slots_update_own" on worship_scale_slots for update
  using (member_id = current_member_id())
  with check (member_id = current_member_id());

-- Repertório: leitura geral p/ autenticados; membros da equipe de louvor também
-- podem cadastrar músicas (spec: "membros da equipe de louvor podem adicionar músicas").
create policy "songs_select" on songs for select using (auth.role() = 'authenticated');
create policy "songs_write_leader" on songs for all using (is_leader()) with check (is_leader());
create policy "songs_insert_worship_team" on songs for insert
  with check (exists (
    select 1 from worship_team_roles wtr
    where wtr.member_id = current_member_id() and wtr.active
  ));

create policy "song_voice_parts_select" on song_voice_parts for select using (auth.role() = 'authenticated');
create policy "song_voice_parts_write_leader" on song_voice_parts for all using (is_leader()) with check (is_leader());

create policy "scale_songs_select" on scale_songs for select using (auth.role() = 'authenticated');
create policy "scale_songs_write_leader" on scale_songs for all using (is_leader()) with check (is_leader());
