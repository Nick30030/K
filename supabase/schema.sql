-- Migration Supabase pour NickShop Content Studio (Version 2 - Pilotage Commercial)
-- Compatible avec le schéma existant. Ne supprime aucune table existante.

create extension if not exists pgcrypto;

-- 1. Paramètres de la marque
create table if not exists public.brand_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade unique,
  name text not null default 'NickShop',
  goal text not null default '',
  whatsapp text not null default '',
  monthly_budget numeric not null default 0 check (monthly_budget >= 0),
  external_image_tool text default 'https://aistudio.google.com',
  created_at timestamptz not null default now()
);

-- 2. Produits enrichis (avec coûts et seuils de stock faible)
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(name) > 0),
  category text not null,
  brand text default 'NickShop',
  price numeric not null check(price >= 0),
  cost numeric default 0 check(cost >= 0),
  variable_costs numeric default 0 check(variable_costs >= 0),
  description text not null default '',
  verified_features text not null default '',
  stock integer not null default 0 check(stock >= 0),
  low_stock_threshold integer default 3 check(low_stock_threshold >= 0),
  active boolean not null default true,
  demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(id, user_id)
);

-- 3. Calendriers éditoriaux
create table if not exists public.calendars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  start_date date not null,
  duration integer not null check(duration in (7, 15, 30)),
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique(id, user_id)
);

-- 4. Idées visuelles et prompts
create table if not exists public.visual_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_id uuid,
  title text not null,
  concept jsonb not null,
  created_at timestamptz not null default now(),
  foreign key(product_id, user_id) references public.products(id, user_id),
  unique(id, user_id)
);

-- 5. Publications planifiées et publiées
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_id uuid,
  calendar_id uuid,
  visual_idea_id uuid,
  title text not null,
  body text not null,
  platform text not null check(platform in ('Facebook', 'TikTok', 'WhatsApp')),
  scheduled_at timestamptz,
  published_at timestamptz,
  status text not null default 'Idée' check(status in ('Idée', 'À rédiger', 'Visuel à créer', 'Prêt', 'Programmé', 'Publié')),
  content_type text not null default 'Présentation produit',
  goal text not null default '',
  format text not null default '',
  cta text not null default '',
  paid boolean not null default false,
  demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key(product_id, user_id) references public.products(id, user_id),
  foreign key(calendar_id, user_id) references public.calendars(id, user_id),
  foreign key(visual_idea_id, user_id) references public.visual_ideas(id, user_id),
  unique(id, user_id)
);

-- 6. Bibliothèque de contenus enregistrés
create table if not exists public.content_library (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_id uuid,
  platform text not null check(platform in ('Facebook', 'TikTok', 'WhatsApp')),
  body text not null,
  created_at timestamptz not null default now(),
  foreign key(product_id, user_id) references public.products(id, user_id)
);

-- 7. NOUVEAU : Suivi des commandes réelles et statut d'encaissement
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  order_date date not null default current_date,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null default 1 check(quantity > 0),
  unit_price numeric not null check(unit_price >= 0),
  discount numeric not null default 0 check(discount >= 0),
  delivery_cost numeric not null default 0 check(delivery_cost >= 0),
  collected_amount numeric not null default 0 check(collected_amount >= 0),
  status text not null default 'Nouveau prospect' check(status in (
    'Nouveau prospect',
    'Commande confirmée',
    'En préparation',
    'Livrée',
    'Annulée',
    'Retournée',
    'En attente de paiement'
  )),
  channel text not null default 'WhatsApp' check(channel in (
    'Facebook',
    'TikTok',
    'WhatsApp',
    'Publicité Meta Ads',
    'Autre'
  )),
  post_id uuid references public.posts(id) on delete set null,
  notes text default '',
  demo boolean not null default false,
  created_at timestamptz not null default now()
);

-- 8. NOUVEAU : Logs quotidiens des dépenses pub et conversations WhatsApp
create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  log_date date not null default current_date,
  ad_spend numeric not null default 0 check(ad_spend >= 0),
  whatsapp_conversations integer not null default 0 check(whatsapp_conversations >= 0),
  notes text default '',
  created_at timestamptz not null default now(),
  unique(user_id, log_date)
);

-- 9. Sécurité RLS sur toutes les tables
do $$ declare tab text; begin
 foreach tab in array array[
   'brand_settings',
   'products',
   'calendars',
   'visual_ideas',
   'posts',
   'content_library',
   'orders',
   'daily_logs'
 ] loop
   execute format('alter table public.%I enable row level security', tab);
   execute format('drop policy if exists own_rows on public.%I', tab);
   execute format('create policy own_rows on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', tab);
   execute format('create index if not exists %I_user_id_idx on public.%I(user_id)', tab, tab);
 end loop;
end $$;

-- 10. Triggers de mise à jour
create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists posts_updated_at on public.posts;
create trigger posts_updated_at before update on public.posts for each row execute function public.touch_updated_at();

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products for each row execute function public.touch_updated_at();
