-- ============================================================
-- DDS LINKS — motor central de QR dinâmico
-- ============================================================
-- Separa "placa física" de "link/QR dinâmico". A placa aponta para um
-- link; o link aponta para um destino que pode mudar sem reimpressão.

create type dds_link_status as enum ('AGUARDANDO_DESTINO', 'ATIVO', 'PAUSADO');

create table dds_links (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,           -- DDS-Q7K29P (série própria, prefixo Q)
  slug text not null unique,             -- vai na URL: go.ddsinovacao.com.br/:slug
  produto text not null default 'avaliacoes',
  destino_atual text,                    -- null até a ativação
  company_id uuid references companies(id) on delete set null, -- denormalizado, para RLS/consulta rápida do cliente
  qr_png_path text,                      -- caminho no Supabase Storage (bucket qr-codes)
  qr_svg_path text,
  status dds_link_status not null default 'AGUARDANDO_DESTINO',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_dds_links_slug on dds_links(slug);
create index idx_dds_links_company on dds_links(company_id);

create table link_destination_history (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references dds_links(id) on delete cascade,
  destino_anterior text,
  destino_novo text not null,
  alterado_por uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_link_history_link on link_destination_history(link_id);

-- ---------- Migração dos dados já existentes em `plates` ----------
-- Cria um dds_link para cada placa hoje existente, herdando o slug que
-- já estava em plates.slug e o destino que já estava resolvido via
-- companies.write_a_review_uri.
insert into dds_links (codigo, slug, produto, destino_atual, company_id, status, created_at)
select
  'DDS-Q' || upper(substr(md5(random()::text || p.id::text), 1, 6)),
  p.slug,
  'avaliacoes',
  c.write_a_review_uri,
  p.company_id,
  case
    when p.status = 'ATIVA' then 'ATIVO'
    when p.status = 'AGUARDANDO_ATIVACAO' then 'AGUARDANDO_DESTINO'
    else 'PAUSADO'
  end::dds_link_status,
  p.created_at
from plates p
left join companies c on c.id = p.company_id;

-- Liga cada placa ao seu novo dds_link (via slug, que ainda existe nos
-- dois lados neste ponto da migration).
alter table plates add column dynamic_link_id uuid references dds_links(id);
update plates p set dynamic_link_id = dl.id
from dds_links dl
where dl.slug = p.slug;

-- Agora sim, o slug sai de plates — ele mora só em dds_links daqui pra frente.
alter table plates drop column slug;
alter table plates alter column dynamic_link_id set not null;

-- ---------- Renomeia scan_events -> link_scan_events e liga ao link ----------
alter table scan_events rename to link_scan_events;
alter table link_scan_events add column link_id uuid references dds_links(id);
update link_scan_events se set link_id = p.dynamic_link_id
from plates p
where p.id = se.plate_id;
create index idx_link_scan_events_link on link_scan_events(link_id);

-- ============================================================
-- RLS
-- ============================================================
alter table dds_links enable row level security;
alter table link_destination_history enable row level security;

create policy "dds_links_select_own_or_admin" on dds_links
  for select using (
    is_admin() or
    company_id in (select id from companies where owner_id = auth.uid())
  );
create policy "dds_links_admin_all" on dds_links
  for all using (is_admin());

create policy "link_history_admin_only" on link_destination_history
  for select using (is_admin());
create policy "link_history_admin_insert" on link_destination_history
  for insert with check (is_admin());

-- ---------- Função para alterar destino com histórico atômico ----------
-- A troca de destino é a operação mais sensível do sistema: nunca deve
-- perder o valor anterior, e só admin pode executá-la.
create function alter_link_destino(p_link_id uuid, p_novo_destino text)
returns void
language plpgsql
security invoker
as $$
declare
  v_antigo text;
begin
  if not is_admin() then
    raise exception 'apenas administradores podem alterar o destino de um link';
  end if;

  select destino_atual into v_antigo from dds_links where id = p_link_id;

  update dds_links
    set destino_atual = p_novo_destino, status = 'ATIVO', updated_at = now()
    where id = p_link_id;

  insert into link_destination_history (link_id, destino_anterior, destino_novo, alterado_por)
    values (p_link_id, v_antigo, p_novo_destino, auth.uid());
end;
$$;
