-- =====================================================================
-- Índice do Peito de Frango — Schema Supabase
-- Execute no SQL Editor do Supabase (idempotente: pode rodar mais de uma vez).
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Tabela: chicken_prices
-- Cada linha é uma etiqueta fotografada em um mercado.
-- ---------------------------------------------------------------------
create table if not exists public.chicken_prices (
  id              uuid primary key default gen_random_uuid(),
  brand           text not null default 'Outra',
  state_type      text not null default 'resfriado'
                    check (state_type in ('resfriado', 'congelado')),
  price_per_kg    numeric(10,2) not null check (price_per_kg > 0 and price_per_kg < 1000),
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

-- ---------------------------------------------------------------------
-- RLS: leitura pública, escrita apenas para usuários autenticados
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
  for insert to authenticated with check (true);
create policy "chicken_prices_auth_update" on public.chicken_prices
  for update to authenticated using (true) with check (true);
create policy "chicken_prices_auth_delete" on public.chicken_prices
  for delete to authenticated using (true);

drop policy if exists "economic_settings_public_read" on public.economic_settings;
drop policy if exists "economic_settings_auth_update" on public.economic_settings;

create policy "economic_settings_public_read" on public.economic_settings
  for select to anon, authenticated using (true);
create policy "economic_settings_auth_update" on public.economic_settings
  for update to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------
-- Storage: bucket público `price-photos` (fotos .webp já comprimidas)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'price-photos',
  'price-photos',
  true,
  1048576, -- 1 MB por arquivo (as fotos chegam com ~150 KB)
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "price_photos_public_read" on storage.objects;
drop policy if exists "price_photos_auth_insert" on storage.objects;
drop policy if exists "price_photos_auth_update" on storage.objects;
drop policy if exists "price_photos_auth_delete" on storage.objects;

create policy "price_photos_public_read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'price-photos');
create policy "price_photos_auth_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'price-photos');
create policy "price_photos_auth_update" on storage.objects
  for update to authenticated using (bucket_id = 'price-photos') with check (bucket_id = 'price-photos');
create policy "price_photos_auth_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'price-photos');
