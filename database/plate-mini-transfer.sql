-- A reset/transfer must not expose the previous customer's page to the new one.
alter table public.mini_pages add column plate_company_id uuid references public.companies(id);
alter table public.mini_pages drop constraint mini_pages_plate_id_key;
alter table public.mini_pages add constraint mini_pages_plate_company_key unique (plate_id, plate_company_id);
alter table public.mini_pages add constraint mini_pages_plate_company_check check ((plate_id is null) = (plate_company_id is null));
create function public.reset_plate_mini_access() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if old.company_id is distinct from new.company_id then
    new.mini_site_enabled := false;
    update public.mini_pages set published = false where plate_id = old.id;
  end if;
  return new;
end;
$$;
revoke all on function public.reset_plate_mini_access() from public, anon, authenticated;
create trigger reset_plate_mini_access before update of company_id on public.plates
for each row execute function public.reset_plate_mini_access();
