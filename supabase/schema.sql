-- Immobilia - backend del sito (prezzi, regole, pulizie, foto)
-- Tutte le tabelle iniziano con "site_" per non mischiarsi con altro.
-- Può essere eseguito più volte senza danni (idempotente).

create extension if not exists pgcrypto;

-- 1) Chi del team può modificare ------------------------------------------------
create table if not exists site_admins (
  email text primary key,
  role  text not null default 'editor' check (role in ('owner','editor')),
  created_at timestamptz not null default now()
);

create or replace function site_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from site_admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function site_is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from site_admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')) and role = 'owner'
  );
$$;

-- 2) Proprietà: regole di pulizia, ospiti, animali ------------------------------
create table if not exists site_properties (
  slug text primary key,
  name text not null,
  active boolean not null default true,
  cleaning_fee_base numeric not null default 0 check (cleaning_fee_base >= 0),
  cleaning_fee_per_guest numeric not null default 0 check (cleaning_fee_per_guest >= 0),
  cleaning_fee_by_guests jsonb,                       -- es. {"1":14,"2":14,"3":28}
  base_occupancy int not null default 2 check (base_occupancy between 1 and 20),
  extra_guest_fee_per_night numeric not null default 0 check (extra_guest_fee_per_night >= 0),
  pet_fee numeric not null default 0 check (pet_fee >= 0),
  commission_percent numeric not null default 15 check (commission_percent between 0 and 100),
  discount_percent numeric check (discount_percent between 0 and 90),   -- null = sconto globale del sito
  min_stay int check (min_stay between 1 and 60),                        -- null = minimo di PriceLabs
  updated_at timestamptz not null default now(),
  updated_by text
);

-- 3) Prezzo fisso per intervallo di date (vince su tutto il resto) ---------------
create table if not exists site_price_overrides (
  id uuid primary key default gen_random_uuid(),
  property_slug text not null references site_properties(slug) on delete cascade,
  date_from date not null,
  date_to date not null,
  price numeric not null check (price > 0 and price < 10000),
  note text,
  created_at timestamptz not null default now(),
  created_by text,
  check (date_to >= date_from)
);
create index if not exists site_price_overrides_prop_idx on site_price_overrides(property_slug, date_from, date_to);

-- 4) Regole di prezzo (si applicano sopra il prezzo base, in ordine di priorità) --
--   percent_adjust : +/- % su un intervallo di date          params {"percent": 10}
--   weekend_markup : +% per venerdì e sabato                 params {"percent": 15}
create table if not exists site_price_rules (
  id uuid primary key default gen_random_uuid(),
  property_slug text references site_properties(slug) on delete cascade,  -- null = tutte
  kind text not null check (kind in ('percent_adjust','weekend_markup')),
  date_from date,
  date_to date,
  params jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  priority int not null default 100,
  note text,
  created_at timestamptz not null default now(),
  created_by text
);

-- 5) Foto -----------------------------------------------------------------------
create table if not exists site_photos (
  id uuid primary key default gen_random_uuid(),
  property_slug text not null references site_properties(slug) on delete cascade,
  storage_path text not null,           -- percorso nel bucket "site-photos"
  caption text,
  position int not null default 0,
  created_at timestamptz not null default now(),
  created_by text
);
create index if not exists site_photos_prop_idx on site_photos(property_slug, position);

-- 6) Registro modifiche (chi ha cambiato cosa) -----------------------------------
create table if not exists site_audit (
  id bigserial primary key,
  at timestamptz not null default now(),
  who text,
  table_name text,
  action text,
  row_data jsonb
);

create or replace function site_audit_trg() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into site_audit(who, table_name, action, row_data)
  values (coalesce(auth.jwt() ->> 'email', 'sistema'), tg_table_name, tg_op,
          to_jsonb(case when tg_op = 'DELETE' then old else new end));
  return null;
end $$;

create or replace function site_touch() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  new.updated_by := coalesce(auth.jwt() ->> 'email', new.updated_by);
  return new;
end $$;

drop trigger if exists site_properties_touch on site_properties;
create trigger site_properties_touch before update on site_properties
  for each row execute function site_touch();

do $$
declare t text;
begin
  foreach t in array array['site_properties','site_price_overrides','site_price_rules','site_photos','site_admins']
  loop
    execute format('drop trigger if exists %I_audit on %I', t, t);
    execute format('create trigger %I_audit after insert or update or delete on %I for each row execute function site_audit_trg()', t, t);
  end loop;
end $$;

-- 7) Sicurezza: le tabelle sono visibili e modificabili SOLO dal team -------------
alter table site_admins          enable row level security;
alter table site_properties      enable row level security;
alter table site_price_overrides enable row level security;
alter table site_price_rules     enable row level security;
alter table site_photos          enable row level security;
alter table site_audit           enable row level security;

do $$
declare t text;
begin
  foreach t in array array['site_properties','site_price_overrides','site_price_rules','site_photos']
  loop
    execute format('drop policy if exists %I_team on %I', t, t);
    execute format('create policy %I_team on %I for all to authenticated using (site_is_admin()) with check (site_is_admin())', t, t);
  end loop;
end $$;

drop policy if exists site_admins_read on site_admins;
create policy site_admins_read on site_admins for select to authenticated using (site_is_admin());
drop policy if exists site_admins_owner_write on site_admins;
create policy site_admins_owner_write on site_admins for all to authenticated
  using (site_is_owner()) with check (site_is_owner());

drop policy if exists site_audit_read on site_audit;
create policy site_audit_read on site_audit for select to authenticated using (site_is_admin());

-- 8) Viste pubbliche: solo ciò che il sito deve leggere (niente commissioni) -------
create or replace view site_public_properties as
  select slug, name, active, cleaning_fee_base, cleaning_fee_per_guest, cleaning_fee_by_guests,
         base_occupancy, extra_guest_fee_per_night, pet_fee, discount_percent, min_stay
  from site_properties;

create or replace view site_public_overrides as
  select property_slug, date_from, date_to, price from site_price_overrides;

create or replace view site_public_rules as
  select property_slug, kind, date_from, date_to, params, priority
  from site_price_rules where enabled;

create or replace view site_public_photos as
  select property_slug, storage_path, caption, position from site_photos;

grant select on site_public_properties, site_public_overrides, site_public_rules, site_public_photos to anon, authenticated;
revoke all on site_admins, site_properties, site_price_overrides, site_price_rules, site_photos, site_audit from anon;

-- 9) Archivio foto (lettura pubblica, scrittura solo team) ------------------------
insert into storage.buckets (id, name, public) values ('site-photos', 'site-photos', true)
  on conflict (id) do nothing;

drop policy if exists site_photos_read on storage.objects;
create policy site_photos_read on storage.objects for select using (bucket_id = 'site-photos');
drop policy if exists site_photos_write on storage.objects;
create policy site_photos_write on storage.objects for insert to authenticated
  with check (bucket_id = 'site-photos' and site_is_admin());
drop policy if exists site_photos_update on storage.objects;
create policy site_photos_update on storage.objects for update to authenticated
  using (bucket_id = 'site-photos' and site_is_admin());
drop policy if exists site_photos_delete on storage.objects;
create policy site_photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'site-photos' and site_is_admin());
