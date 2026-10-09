-- Mini pages: published business content only. Owner edits; visitors read published pages.
create table public.mini_pages (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$'),
 content jsonb not null check (jsonb_typeof(content) = 'object' and length(content::text) <= 200000 and length(content->>'name') between 1 and 1000),
 published boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index mini_pages_owner_idx on public.mini_pages(owner_id);
alter table public.mini_pages enable row level security;
create policy mini_pages_public_read on public.mini_pages for select to anon, authenticated using (published = true);
create policy mini_pages_owner_read on public.mini_pages for select to authenticated using ((select auth.uid()) = owner_id);
create policy mini_pages_owner_insert on public.mini_pages for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy mini_pages_owner_update on public.mini_pages for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy mini_pages_owner_delete on public.mini_pages for delete to authenticated using ((select auth.uid()) = owner_id);
grant select on public.mini_pages to anon;
grant select, insert, update, delete on public.mini_pages to authenticated;
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types) values ('mini-page-images','mini-page-images',true,5242880,array['image/jpeg','image/png','image/webp']);
create policy mini_images_owner_insert on storage.objects for insert to authenticated with check (bucket_id = 'mini-page-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy mini_images_owner_select on storage.objects for select to authenticated using (bucket_id = 'mini-page-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy mini_images_owner_delete on storage.objects for delete to authenticated using (bucket_id = 'mini-page-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
