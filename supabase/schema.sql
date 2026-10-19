-- Future cloud adapter: this migration is provided but is not applied by the local MVP.
-- Run using the Supabase SQL editor only when connecting the application.
create extension if not exists pgcrypto;
create table public.brand_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade unique,
  name text not null default 'NickShop',
  goal text not null default '',
  whatsapp text not null default '',
  monthly_budget numeric not null default 0 check (monthly_budget >= 0),
  created_at timestamptz not null default now()
);
create table public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(name)>0),
  category text not null,
  price numeric not null check(price>=0),
  description text not null default '',
  verified_features text not null default '',
  stock integer not null default 0 check(stock>=0),
  active boolean not null default true,
  demo boolean not null default false,
  created_at timestamptz not null default now(),
  unique(id,user_id)
);
create table public.calendars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  start_date date not null,
  duration integer not null check(duration in (7,15,30)),
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique(id,user_id)
);
create table public.visual_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_id uuid,
  title text not null,
  concept jsonb not null,
  created_at timestamptz not null default now(),
  foreign key(product_id,user_id) references public.products(id,user_id),
  unique(id,user_id)
);
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_id uuid,
  calendar_id uuid,
  visual_idea_id uuid,
  title text not null,
  body text not null,
  platform text not null check(platform in ('Facebook','TikTok','WhatsApp')),
  scheduled_at timestamptz,
  status text not null default 'Idée' check(status in ('Idée','À rédiger','Visuel à créer','Prêt','Programmé','Publié')),
  content_type text not null default 'Présentation produit',
  goal text not null default '',
  format text not null default '',
  cta text not null default '',
  paid boolean not null default false,
  demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key(product_id,user_id) references public.products(id,user_id),
  foreign key(calendar_id,user_id) references public.calendars(id,user_id),
  foreign key(visual_idea_id,user_id) references public.visual_ideas(id,user_id),
  unique(id,user_id)
);
create table public.content_library (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_id uuid,
  platform text not null check(platform in ('Facebook','TikTok','WhatsApp')),
  body text not null,
  created_at timestamptz not null default now(),
  foreign key(product_id,user_id) references public.products(id,user_id)
);
create table public.media (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_id uuid,
  storage_path text not null,
  mime_type text not null check(mime_type in ('image/jpeg','image/png','image/webp')),
  created_at timestamptz not null default now(),
  foreign key(product_id,user_id) references public.products(id,user_id)
);
create table public.marketing_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  period_start date not null,
  period_end date not null check(period_end>=period_start),
  spend numeric not null default 0 check(spend>=0),
  conversations integer not null default 0 check(conversations>=0),
  orders integer not null default 0 check(orders>=0),
  revenue numeric not null default 0 check(revenue>=0),
  product_cost numeric not null default 0 check(product_cost>=0),
  created_at timestamptz not null default now()
);
do $$ declare tab text; begin
 foreach tab in array array['brand_settings','products','calendars','visual_ideas','posts','content_library','media','marketing_results'] loop
 execute format('alter table public.%I enable row level security',tab);
 execute format('create policy own_rows on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',tab);
 execute format('create index on public.%I(user_id)',tab);
 end loop;
end $$;
create function public.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end $$;
create trigger posts_updated_at before update on public.posts for each row execute function public.touch_updated_at();
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('product-media','product-media',false,3145728,array['image/jpeg','image/png','image/webp']);
create policy own_media_read on storage.objects for select to authenticated using(bucket_id='product-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy own_media_insert on storage.objects for insert to authenticated with check(bucket_id='product-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy own_media_update on storage.objects for update to authenticated using(bucket_id='product-media' and (storage.foldername(name))[1]=(select auth.uid())::text) with check(bucket_id='product-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy own_media_delete on storage.objects for delete to authenticated using(bucket_id='product-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
