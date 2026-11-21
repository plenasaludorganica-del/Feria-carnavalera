-- =====================================================================
--  FERIA DEL COMPARSERO — esquema inicial
--  Ejecutar en Supabase: SQL Editor → pegar todo → Run
--  (o `supabase db push` si usás la CLI).
-- =====================================================================
--
--  IDEA CENTRAL DEL VENCIMIENTO
--  ----------------------------
--  Cada vendedor tiene `paid_until` (fecha): el último día del mes que
--  ya tiene pago. Un vendedor está ACTIVO si:
--      not suspended  AND  paid_until >= hoy
--  El estado se CALCULA en el momento: no hace falta un cron que
--  "bloquee" cuentas. El 1° de cada mes, quien no pagó deja de cumplir
--  la condición y sus productos desaparecen solos del catálogo público
--  (las filas NO se borran). Cuando entra el pago, `paid_until` avanza
--  y todo vuelve a verse tal cual estaba.
-- =====================================================================

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------
-- Fecha "de hoy" en la zona horaria del negocio.
-- Si operás desde Uruguay cambiá a 'America/Montevideo'.
-- ---------------------------------------------------------------------
create or replace function public.app_today()
returns date
language sql stable
set search_path = ''
as $$ select (now() at time zone 'America/Argentina/Buenos_Aires')::date $$;

-- Último día del mes de una fecha dada.
create or replace function public.end_of_month(d date)
returns date
language sql immutable
set search_path = ''
as $$ select (date_trunc('month', d) + interval '1 month - 1 day')::date $$;

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
do $$ begin
  create type public.product_category as enum
    ('plumas', 'piedreria', 'trajes', 'armazones', 'zapatos', 'otros');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.product_status as enum ('active', 'paused');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.user_role as enum ('seller', 'admin');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- PERFILES (1 por usuario de Supabase Auth)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null default '',
  whatsapp      text check (whatsapp is null or whatsapp ~ '^[0-9]{8,15}$'),
  city          text,
  role          public.user_role not null default 'seller',
  paid_until    date,                       -- null = nunca pagó
  suspended     boolean not null default false,  -- bloqueo manual del admin
  admin_note    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on column public.profiles.whatsapp is
  'Solo dígitos, con código de país y sin +. Ej: 5493511234567';
comment on column public.profiles.paid_until is
  'Último día cubierto por la cuota. Siempre es fin de mes.';

-- Crear el perfil automáticamente al registrarse.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Helpers de estado
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;

create or replace function public.is_seller_active(uid uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid
      and not p.suspended
      and p.paid_until is not null
      and p.paid_until >= public.app_today()
  )
$$;

-- Estado legible para el panel: 'activo' | 'vencido' | 'sin_pago' | 'suspendido'
create or replace function public.subscription_state(p public.profiles)
returns text
language sql stable
set search_path = ''
as $$
  select case
    when p.suspended then 'suspendido'
    when p.paid_until is null then 'sin_pago'
    when p.paid_until >= public.app_today() then 'activo'
    else 'vencido'
  end
$$;

-- ---------------------------------------------------------------------
-- PRODUCTOS
-- ---------------------------------------------------------------------
create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  seller_id    uuid not null references public.profiles(id) on delete cascade,
  title        text not null check (char_length(title) between 3 and 90),
  description  text not null default '' check (char_length(description) <= 3000),
  price        numeric(12,2) not null check (price >= 0),
  currency     text not null default 'ARS',
  category     public.product_category not null,
  condition    text not null default 'usado' check (condition in ('usado', 'como_nuevo', 'nuevo')),
  images       text[] not null default '{}' check (cardinality(images) <= 8),
  status       public.product_status not null default 'active',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists products_seller_idx   on public.products (seller_id);
create index if not exists products_cat_idx      on public.products (category, created_at desc);
create index if not exists products_title_trgm   on public.products using gin (title gin_trgm_ops);
create index if not exists products_desc_trgm    on public.products using gin (description gin_trgm_ops);

-- updated_at automático
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- PAGOS (historial de cuotas — lo escribe solo el webhook de Mercado Pago)
-- ---------------------------------------------------------------------
create table if not exists public.payments (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  provider         text not null default 'mercadopago',
  mp_payment_id    text unique,
  mp_preference_id text,
  status           text not null,             -- approved | pending | rejected | manual ...
  amount           numeric(12,2),
  currency         text default 'ARS',
  period_start     date,
  period_end       date,                      -- nuevo paid_until que otorgó este pago
  raw              jsonb,
  created_at       timestamptz not null default now()
);
create index if not exists payments_user_idx on public.payments (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- REGISTRAR UN PAGO APROBADO  (lo llama el webhook con la service role)
--   * Idempotente: si Mercado Pago avisa dos veces, se cuenta una sola.
--   * Si estaba al día: suma el mes siguiente.
--   * Si estaba vencido o nunca pagó: cubre hasta fin del mes actual.
-- ---------------------------------------------------------------------
create or replace function public.register_payment(
  p_user_id uuid,
  p_mp_payment_id text,
  p_status text,
  p_amount numeric,
  p_currency text,
  p_preference_id text default null,
  p_raw jsonb default null
) returns date
language plpgsql security definer
set search_path = ''
as $$
declare
  v_prev_status text;
  v_current     date;
  v_start       date;
  v_end         date;
begin
  -- Bloquea al usuario para que dos avisos simultáneos no sumen dos meses.
  select paid_until into v_current from public.profiles where id = p_user_id for update;
  if not found then raise exception 'perfil % inexistente', p_user_id; end if;

  select status, period_end into v_prev_status, v_end
  from public.payments where mp_payment_id = p_mp_payment_id;

  -- Ya acreditado antes: no se vuelve a sumar.
  if v_prev_status = 'approved' then
    return v_end;
  end if;

  -- Pendiente / rechazado: solo dejamos registro.
  if p_status <> 'approved' then
    insert into public.payments (user_id, mp_payment_id, mp_preference_id, status, amount, currency, raw)
    values (p_user_id, p_mp_payment_id, p_preference_id, p_status, p_amount, p_currency, p_raw)
    on conflict (mp_payment_id) do update set status = excluded.status, raw = excluded.raw;
    return null;
  end if;

  -- Aprobado: al día → mes siguiente; vencido o nuevo → hasta fin de este mes.
  v_start := greatest(coalesce(v_current + 1, public.app_today()), public.app_today());
  v_end   := public.end_of_month(v_start);

  insert into public.payments (user_id, mp_payment_id, mp_preference_id, status, amount, currency,
                               period_start, period_end, raw)
  values (p_user_id, p_mp_payment_id, p_preference_id, 'approved', p_amount, p_currency,
          v_start, v_end, p_raw)
  on conflict (mp_payment_id) do update
    set status = 'approved', period_start = excluded.period_start,
        period_end = excluded.period_end, raw = excluded.raw;

  update public.profiles set paid_until = v_end where id = p_user_id;
  return v_end;
end $$;

revoke all on function public.register_payment from public, anon, authenticated;
grant execute on function public.register_payment to service_role;

-- ---------------------------------------------------------------------
-- CATÁLOGO PÚBLICO (solo vendedores activos, con WhatsApp, producto activo)
-- Se expone por funciones para no abrir la tabla de perfiles al público.
-- ---------------------------------------------------------------------
create or replace function public.search_catalog(
  q text default null,
  cat public.product_category default null,
  lim int default 24,
  off int default 0
)
returns table (
  id uuid, title text, price numeric, currency text, category public.product_category,
  condition text, cover text, city text, created_at timestamptz, total bigint
)
language sql stable security definer
set search_path = ''
as $$
  select p.id, p.title, p.price, p.currency, p.category, p.condition,
         p.images[1] as cover, pr.city, p.created_at,
         count(*) over () as total
  from public.products p
  join public.profiles pr on pr.id = p.seller_id
  where p.status = 'active'
    and not pr.suspended
    and pr.paid_until >= public.app_today()
    and pr.whatsapp is not null
    and (cat is null or p.category = cat)
    and (q is null or q = '' or p.title ilike '%' || q || '%' or p.description ilike '%' || q || '%')
  order by p.created_at desc
  limit least(greatest(lim, 1), 60) offset greatest(off, 0)
$$;

create or replace function public.get_catalog_product(pid uuid)
returns table (
  id uuid, title text, description text, price numeric, currency text,
  category public.product_category, condition text, images text[], created_at timestamptz,
  seller_name text, seller_city text, whatsapp text
)
language sql stable security definer
set search_path = ''
as $$
  select p.id, p.title, p.description, p.price, p.currency, p.category, p.condition,
         p.images, p.created_at, pr.display_name, pr.city, pr.whatsapp
  from public.products p
  join public.profiles pr on pr.id = p.seller_id
  where p.id = pid
    and p.status = 'active'
    and not pr.suspended
    and pr.paid_until >= public.app_today()
    and pr.whatsapp is not null
$$;

grant execute on function public.search_catalog to anon, authenticated;
grant execute on function public.get_catalog_product to anon, authenticated;

-- ---------------------------------------------------------------------
-- ADMIN
-- ---------------------------------------------------------------------
create or replace function public.admin_set_suspended(uid uuid, value boolean, note text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'solo administradores'; end if;
  update public.profiles set suspended = value, admin_note = coalesce(note, admin_note) where id = uid;
end $$;

-- Cobro manual (efectivo/transferencia): extiende hasta fin de un mes dado.
create or replace function public.admin_set_paid_until(uid uuid, until date, note text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'solo administradores'; end if;
  update public.profiles set paid_until = public.end_of_month(until) where id = uid;
  insert into public.payments (user_id, provider, status, period_end, raw)
  values (uid, 'manual', 'manual', public.end_of_month(until),
          jsonb_build_object('by', auth.uid(), 'note', note));
end $$;

grant execute on function public.admin_set_suspended to authenticated;
grant execute on function public.admin_set_paid_until to authenticated;

create or replace view public.admin_sellers
with (security_invoker = true) as
select p.id, p.display_name, u.email, p.whatsapp, p.city, p.role, p.paid_until, p.suspended,
       p.admin_note, p.created_at,
       public.subscription_state(p) as state,
       (select count(*) from public.products x where x.seller_id = p.id) as products_count,
       (select max(created_at) from public.payments y where y.user_id = p.id and y.status in ('approved','manual')) as last_payment_at
from public.profiles p
join auth.users u on u.id = p.id;
-- security_invoker: la vista respeta RLS; solo un admin ve filas.
-- auth.users no es accesible para authenticated, así que damos acceso vía función:
revoke all on public.admin_sellers from anon, authenticated;

create or replace function public.admin_list_sellers()
returns setof public.admin_sellers
language sql stable security definer set search_path = '' as $$
  select * from public.admin_sellers where public.is_admin() order by created_at desc
$$;
grant execute on function public.admin_list_sellers to authenticated;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.payments enable row level security;

-- Perfiles: cada uno ve el suyo; el admin ve todos.
drop policy if exists "perfil propio" on public.profiles;
create policy "perfil propio" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or public.is_admin());

drop policy if exists "editar perfil propio" on public.profiles;
create policy "editar perfil propio" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- El usuario solo puede tocar estas columnas (nunca paid_until/suspended/role).
revoke update on public.profiles from authenticated, anon;
grant update (display_name, whatsapp, city) on public.profiles to authenticated;

-- Productos: el dueño ve todos los suyos (incluso ocultos por vencimiento).
drop policy if exists "ver mis productos" on public.products;
create policy "ver mis productos" on public.products
  for select to authenticated using (seller_id = (select auth.uid()) or public.is_admin());

-- Publicar/editar: solo con cuota al día y WhatsApp cargado.
drop policy if exists "publicar" on public.products;
create policy "publicar" on public.products
  for insert to authenticated
  with check (
    seller_id = (select auth.uid())
    and public.is_seller_active((select auth.uid()))
    and exists (select 1 from public.profiles where id = (select auth.uid()) and whatsapp is not null)
  );

drop policy if exists "editar mis productos" on public.products;
create policy "editar mis productos" on public.products
  for update to authenticated
  using (seller_id = (select auth.uid()) and public.is_seller_active((select auth.uid())))
  with check (seller_id = (select auth.uid()));

drop policy if exists "borrar mis productos" on public.products;
create policy "borrar mis productos" on public.products
  for delete to authenticated using (seller_id = (select auth.uid()) or public.is_admin());

-- Pagos: cada uno ve su historial; solo el backend escribe.
drop policy if exists "ver mis pagos" on public.payments;
create policy "ver mis pagos" on public.payments
  for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());

-- ---------------------------------------------------------------------
-- STORAGE: fotos de productos
--   Ruta: product-images/<user_id>/<archivo>.webp
--   Lectura pública, escritura solo en la carpeta propia.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 3145728,
        array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

drop policy if exists "subir fotos propias" on storage.objects;
create policy "subir fotos propias" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "editar fotos propias" on storage.objects;
create policy "editar fotos propias" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "borrar fotos propias" on storage.objects;
create policy "borrar fotos propias" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ---------------------------------------------------------------------
-- Para hacerte admin (correr una vez, con tu email):
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'TU_EMAIL');
-- ---------------------------------------------------------------------
