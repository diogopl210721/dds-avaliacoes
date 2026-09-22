-- ============================================================
-- DDS AVALIAÇÕES — schema inicial
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- ENUMS ----------
create type plate_status as enum ('CRIADA', 'AGUARDANDO_ATIVACAO', 'ATIVA', 'BLOQUEADA', 'DESATIVADA');
create type scan_source as enum ('QR', 'NFC', 'UNKNOWN');
create type update_frequency as enum ('weekly', 'daily');
create type user_role as enum ('cliente', 'admin');

-- ---------- PROFILES (estende auth.users) ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  sobrenome text not null,
  whatsapp text,
  role user_role not null default 'cliente',
  created_at timestamptz not null default now()
);

-- ---------- COMPANIES ----------
create table companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete set null,
  nome text not null,
  cnpj text,
  telefone text,
  cidade text,
  estado text,
  google_place_id text unique,
  google_maps_uri text,
  write_a_review_uri text,
  rating numeric(2,1),
  review_count integer,
  update_frequency update_frequency not null default 'weekly',
  last_manual_refresh_at timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_companies_owner on companies(owner_id);

-- ---------- PLATES ----------
create table plates (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,          -- DDS-XXXXXXXX (exibição)
  slug text not null unique,            -- token usado na URL /a/:slug
  pin_hash text not null,               -- hash do PIN de ativação (nunca texto puro)
  pin_used boolean not null default false,
  apelido text,                         -- "Balcão", "Caixa", etc.
  status plate_status not null default 'CRIADA',
  company_id uuid references companies(id) on delete set null,
  fabricada_em timestamptz not null default now(),
  ativada_em timestamptz,
  ultimo_acesso_em timestamptz,
  created_at timestamptz not null default now()
);

create index idx_plates_slug on plates(slug);
create index idx_plates_company on plates(company_id);
create index idx_plates_status on plates(status);

-- ---------- PLATE ACTIVATIONS (auditoria de ativação) ----------
create table plate_activations (
  id uuid primary key default gen_random_uuid(),
  plate_id uuid not null references plates(id) on delete cascade,
  profile_id uuid references profiles(id) on delete set null,
  ip_truncado text,   -- últimos octetos removidos, só para auditoria básica
  created_at timestamptz not null default now()
);

-- ---------- SCAN EVENTS ----------
create table scan_events (
  id uuid primary key default gen_random_uuid(),
  plate_id uuid not null references plates(id) on delete cascade,
  company_id uuid references companies(id) on delete set null,
  source scan_source not null default 'UNKNOWN',
  device_type text,
  browser text,
  operating_system text,
  referrer text,
  country text,
  region text,
  city text,
  created_at timestamptz not null default now()
);

create index idx_scan_events_plate on scan_events(plate_id);
create index idx_scan_events_company_time on scan_events(company_id, created_at);

-- ---------- REVIEW SNAPSHOTS (histórico p/ gráficos) ----------
create table review_snapshots (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  rating numeric(2,1),
  review_count integer,
  captured_at timestamptz not null default now()
);

create index idx_snapshots_company_time on review_snapshots(company_id, captured_at);

-- ---------- GOALS ----------
create table goals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  target_review_count integer,
  target_rating numeric(2,1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- AUDIT LOGS (ações administrativas) ----------
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table companies enable row level security;
alter table plates enable row level security;
alter table plate_activations enable row level security;
alter table scan_events enable row level security;
alter table review_snapshots enable row level security;
alter table goals enable row level security;
alter table audit_logs enable row level security;

-- Helper: verifica se o usuário logado é admin
create function is_admin() returns boolean
language sql stable as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- profiles: cada um vê o próprio; admin vê todos
create policy "profiles_select_own_or_admin" on profiles
  for select using (id = auth.uid() or is_admin());
create policy "profiles_update_own" on profiles
  for update using (id = auth.uid());

-- companies: dono vê a própria; admin vê todas
create policy "companies_select_own_or_admin" on companies
  for select using (owner_id = auth.uid() or is_admin());
create policy "companies_update_own_or_admin" on companies
  for update using (owner_id = auth.uid() or is_admin());
create policy "companies_admin_all" on companies
  for all using (is_admin());

-- plates: dono da empresa vinculada vê; admin vê todas
create policy "plates_select_own_or_admin" on plates
  for select using (
    is_admin() or
    company_id in (select id from companies where owner_id = auth.uid())
  );
create policy "plates_admin_write" on plates
  for all using (is_admin());

-- scan_events: dono da empresa vê os próprios; admin vê todos
create policy "scan_events_select_own_or_admin" on scan_events
  for select using (
    is_admin() or
    company_id in (select id from companies where owner_id = auth.uid())
  );

-- review_snapshots: idem
create policy "snapshots_select_own_or_admin" on review_snapshots
  for select using (
    is_admin() or
    company_id in (select id from companies where owner_id = auth.uid())
  );

-- goals: dono da empresa gerencia as próprias
create policy "goals_all_own_or_admin" on goals
  for all using (
    is_admin() or
    company_id in (select id from companies where owner_id = auth.uid())
  );

-- audit_logs: só admin
create policy "audit_logs_admin_only" on audit_logs
  for select using (is_admin());

-- Observação: INSERT em scan_events, plate_activations, review_snapshots e
-- UPDATE em plates/companies feitos pelo fluxo público (ativação, scan) são
-- sempre executados pelas Edge Functions com a service_role key (que ignora
-- RLS) — nunca pelo client autenticado comum. Por isso não há policy de
-- INSERT pública nessas tabelas.
