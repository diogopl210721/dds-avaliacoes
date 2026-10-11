-- One mini site per activated plate. Existing account-owned pages are preserved.
alter table public.plates add column mini_site_enabled boolean not null default false;
alter table public.mini_pages alter column owner_id drop not null;
alter table public.mini_pages add column plate_id uuid unique references public.plates(id) on delete cascade;
alter table public.mini_pages add constraint mini_pages_one_owner check ((owner_id is null) <> (plate_id is null));
alter policy mini_pages_owner_insert on public.mini_pages with check ((select auth.uid()) = owner_id and plate_id is null);
alter policy mini_pages_owner_update on public.mini_pages using ((select auth.uid()) = owner_id and plate_id is null) with check ((select auth.uid()) = owner_id and plate_id is null);

-- A customer may edit profile details, never their own administrator role.
revoke update on public.profiles from anon, authenticated;
grant update (nome, sobrenome, whatsapp) on public.profiles to authenticated;

create table public.plate_mini_attempts (
  key text primary key,
  attempts integer not null,
  reset_at timestamptz not null
);
alter table public.plate_mini_attempts enable row level security;
revoke all on public.plate_mini_attempts from public, anon, authenticated;
grant all on public.plate_mini_attempts to service_role;
create function public.consume_plate_mini_attempt(p_key text, p_limit integer default 8)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare n integer;
begin
  delete from public.plate_mini_attempts where reset_at < now();
  insert into public.plate_mini_attempts as a (key, attempts, reset_at)
  values (p_key, 1, now() + interval '15 minutes')
  on conflict (key) do update set attempts = a.attempts + 1
  returning attempts into n;
  return n <= p_limit;
end;
$$;
revoke all on function public.consume_plate_mini_attempt(text, integer) from public, anon, authenticated;
grant execute on function public.consume_plate_mini_attempt(text, integer) to service_role;
