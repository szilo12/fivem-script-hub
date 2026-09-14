-- roles
create type public.app_role as enum ('admin','user');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  cfx_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select to authenticated using (id = auth.uid());
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "own roles select" on public.user_roles for select to authenticated using (user_id = auth.uid());
create policy "admins manage roles" on public.user_roles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy "admins view profiles" on public.profiles for select to authenticated using (public.has_role(auth.uid(),'admin'));

-- products
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text not null default '',
  description text not null default '',
  price_cents integer not null default 0,
  currency text not null default 'EUR',
  framework text not null default 'standalone',
  version text not null default '1.0.0',
  cover_url text,
  escrow_asset_name text,
  download_path text,
  features text[] not null default '{}',
  is_published boolean not null default false,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "published products readable" on public.products for select to anon, authenticated using (is_published = true);
create policy "admins manage products" on public.products for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  amount_cents integer not null default 0,
  currency text not null default 'EUR',
  status text not null default 'pending',
  provider text,
  provider_ref text,
  cfx_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "own orders select" on public.orders for select to authenticated using (user_id = auth.uid());
create policy "admins manage orders" on public.orders for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- licenses
create table public.licenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  order_id uuid references public.orders(id) on delete set null,
  license_key text not null unique,
  server_ip text,
  cfx_id text,
  status text not null default 'active',
  activations integer not null default 0,
  last_check_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, update on public.licenses to authenticated;
grant all on public.licenses to service_role;
alter table public.licenses enable row level security;
create policy "own licenses select" on public.licenses for select to authenticated using (user_id = auth.uid());
create policy "own licenses update" on public.licenses for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "admins manage licenses" on public.licenses for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- helpers
create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger products_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger orders_updated_at before update on public.orders for each row execute function public.set_updated_at();
create trigger licenses_updated_at before update on public.licenses for each row execute function public.set_updated_at();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email,'player'),'@',1)))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- demo products
insert into public.products (slug, name, tagline, description, price_cents, framework, version, features, is_published, is_featured, escrow_asset_name) values
('advanced-ems','Advanced EMS','Teljes mentőszolgálat rendszer ESX és QBCore alá','Komplett EMS/ambulance rendszer: sérüléskezelés, hordágy, kórházi ágyak, MDT, halál-időzítő és teljesen konfigurálható sebészeti minijáték. Asset Escrow védett, a konfiguráció nyitott.',2999,'esx','2.4.1',array['Sérülés- és vérzésrendszer','Hordágy és mentőautó interakciók','Kórházi ágyak és kezelések','EMS MDT és hívásrendszer','Nyitott config, escrow-védett mag'],true,true,'advanced_ems'),
('police-mdt','Police MDT','Modern rendőrségi MDT böngészőfelülettel','NUI alapú rendőrségi MDT: körözések, jelentések, bírságok, ujjlenyomat-kereső, járműadatbázis és élő egységkövetés térképen.',3999,'qb','3.1.0',array['Jelentések és körözések','Bírságok és nyilvántartás','Járműadatbázis','Élő egységkövetés','Jogosultsági szintek'],true,true,'police_mdt'),
('vehicle-shop','Vehicle Shop','Prémium autószalon 3D előnézettel','Standalone autószalon: kategóriák, tesztvezetés, részletfizetés, kereskedői jutalék és teljes adminfelület.',1999,'standalone','1.7.2',array['3D előnézet és tesztvezetés','Részletfizetés','Kereskedői jutalék','Adminfelület'],true,false,'vehicle_shop');