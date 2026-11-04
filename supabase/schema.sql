-- =====================================================================
-- Frangômetro (índice do peito de frango) — Schema Supabase
-- Execute no SQL Editor do Supabase (idempotente: pode rodar mais de uma vez).
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Tabela: chicken_prices
-- Cada linha é uma etiqueta fotografada em um mercado.
-- ---------------------------------------------------------------------
create table if not exists public.chicken_prices (
  id              uuid primary key default gen_random_uuid(),
  -- Sadia/Seara/Perdigão/Pif Paf ou o nome digitado em "Outra" (Oi Frango, Ki Frango...).
  brand           text not null default 'Outra' check (char_length(trim(brand)) between 2 and 40),
  state_type      text not null default 'resfriado'
                    check (state_type in ('resfriado', 'congelado')),
  price_per_kg    numeric(10,2) not null check (price_per_kg > 0 and price_per_kg < 1000),
  -- regular = preço normal; oferta = promoção; clube = clube de descontos. O índice usa só regular.
  price_kind      text not null default 'regular'
                    check (price_kind in ('regular', 'oferta', 'clube')),
  market_name     text not null check (char_length(trim(market_name)) > 0),
  city            text not null check (char_length(trim(city)) > 0),
  state           varchar(2) not null check (state ~ '^[A-Z]{2}$'),
  recorded_at     date not null,
  photo_url       text not null,
  original_sha256 text not null check (original_sha256 ~ '^[a-f0-9]{64}$'),
  exif_device     text,
  exif_datetime   timestamp with time zone,
  has_valid_exif  boolean not null default false,
  created_at      timestamp with time zone not null default now()
);

-- Antifraude: a mesma foto original não pode ser cadastrada duas vezes.
-- Bancos criados antes da coluna price_kind:
alter table public.chicken_prices add column if not exists price_kind text not null default 'regular';
alter table public.chicken_prices drop constraint if exists chicken_prices_price_kind_check;
alter table public.chicken_prices add constraint chicken_prices_price_kind_check
  check (price_kind in ('regular', 'oferta', 'clube'));
-- Bancos criados antes da marca digitável:
alter table public.chicken_prices drop constraint if exists chicken_prices_brand_check;
alter table public.chicken_prices add constraint chicken_prices_brand_check
  check (char_length(trim(brand)) between 2 and 40);

create unique index if not exists chicken_prices_original_sha256_key
  on public.chicken_prices (original_sha256);

create index if not exists chicken_prices_recorded_at_idx
  on public.chicken_prices (recorded_at desc);

create index if not exists chicken_prices_location_idx
  on public.chicken_prices (state, city);

-- ---------------------------------------------------------------------
-- Tabela: economic_settings (linha única, id = 1)
-- ---------------------------------------------------------------------
create table if not exists public.economic_settings (
  id          int primary key default 1 check (id = 1),
  min_wage    numeric(10,2) not null default 1518.00 check (min_wage > 0),
  avg_wage    numeric(10,2) not null default 3225.00 check (avg_wage > 0),
  updated_at  timestamp with time zone not null default now()
);

insert into public.economic_settings (id) values (1)
  on conflict (id) do nothing;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists economic_settings_set_updated_at on public.economic_settings;
create trigger economic_settings_set_updated_at
  before update on public.economic_settings
  for each row execute function public.set_updated_at();

-- Correções do admin (preço digitado errado etc.): marca quando o registro foi
-- editado; null = nunca editado. A foto, o hash e o EXIF não mudam.
alter table public.chicken_prices add column if not exists updated_at timestamp with time zone;
drop trigger if exists chicken_prices_set_updated_at on public.chicken_prices;
create trigger chicken_prices_set_updated_at
  before update on public.chicken_prices
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Admin: usuário com app_metadata.role = 'admin'. O app_metadata só pode ser
-- alterado com a service role (painel/SQL), nunca pelo próprio usuário — então,
-- mesmo que o cadastro público fique aberto, ninguém além do admin escreve.
--   update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'
--   where email = 'seu@email.com';
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

-- ---------------------------------------------------------------------
-- RLS: leitura pública, escrita apenas para o admin
-- ---------------------------------------------------------------------
alter table public.chicken_prices    enable row level security;
alter table public.economic_settings enable row level security;

drop policy if exists "chicken_prices_public_read"   on public.chicken_prices;
drop policy if exists "chicken_prices_auth_insert"   on public.chicken_prices;
drop policy if exists "chicken_prices_auth_update"   on public.chicken_prices;
drop policy if exists "chicken_prices_auth_delete"   on public.chicken_prices;

create policy "chicken_prices_public_read" on public.chicken_prices
  for select to anon, authenticated using (true);
create policy "chicken_prices_auth_insert" on public.chicken_prices
  for insert to authenticated with check (public.is_admin());
create policy "chicken_prices_auth_update" on public.chicken_prices
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "chicken_prices_auth_delete" on public.chicken_prices
  for delete to authenticated using (public.is_admin());

drop policy if exists "economic_settings_public_read" on public.economic_settings;
drop policy if exists "economic_settings_auth_update" on public.economic_settings;

create policy "economic_settings_public_read" on public.economic_settings
  for select to anon, authenticated using (true);
create policy "economic_settings_auth_update" on public.economic_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- Fotos: ficam no Cloudflare R2 (modules/photos/storage.ts), não no Supabase Storage.
-- Limpeza de bancos antigos que ainda têm as policies do bucket `price-photos`:
-- ---------------------------------------------------------------------
drop policy if exists "price_photos_public_read" on storage.objects;
drop policy if exists "price_photos_admin_read" on storage.objects;
drop policy if exists "price_photos_auth_insert" on storage.objects;
drop policy if exists "price_photos_auth_update" on storage.objects;
drop policy if exists "price_photos_auth_delete" on storage.objects;
