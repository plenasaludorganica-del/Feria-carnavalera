-- 1) Máximo 5 fotos por publicación.
alter table public.products drop constraint if exists products_images_check;
alter table public.products add constraint products_images_max5 check (cardinality(images) <= 5);

-- 2) El vendedor arma su puesto ANTES de pagar: puede cargar y editar productos
--    aunque no tenga la cuota al día. El catálogo público sigue mostrando solo
--    a quienes pagaron (search_catalog / get_catalog_product no cambian).
--    Requisitos para cargar: no estar suspendido y tener WhatsApp.
create or replace function public.can_edit_stand(uid uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and not p.suspended and p.whatsapp is not null
  )
$$;
revoke execute on function public.can_edit_stand(uuid) from public, anon;
grant execute on function public.can_edit_stand(uuid) to authenticated;

drop policy if exists "publicar" on public.products;
create policy "publicar" on public.products
  for insert to authenticated
  with check (seller_id = (select auth.uid()) and public.can_edit_stand((select auth.uid())));

drop policy if exists "editar mis productos" on public.products;
create policy "editar mis productos" on public.products
  for update to authenticated
  using (seller_id = (select auth.uid()) and public.can_edit_stand((select auth.uid())))
  with check (seller_id = (select auth.uid()));

-- 3) Detalle de producto con el id del vendedor (para enlazar a su puesto).
drop function if exists public.get_catalog_product(uuid);
create function public.get_catalog_product(pid uuid)
returns table (
  id uuid, title text, description text, price numeric, currency text,
  category public.product_category, condition text, images text[], created_at timestamptz,
  seller_id uuid, seller_name text, seller_city text, whatsapp text
)
language sql stable security definer
set search_path = ''
as $$
  select p.id, p.title, p.description, p.price, p.currency, p.category, p.condition,
         p.images, p.created_at, pr.id, pr.display_name, pr.city, pr.whatsapp
  from public.products p
  join public.profiles pr on pr.id = p.seller_id
  where p.id = pid
    and p.status = 'active'
    and public.paid_ok(pr.paid_until, pr.suspended, pr.mp_preapproval_status)
    and pr.whatsapp is not null
$$;
grant execute on function public.get_catalog_product(uuid) to anon, authenticated;

-- 4) Puesto público de un vendedor (solo si tiene la cuota al día).
create or replace function public.get_seller_stand(sid uuid)
returns table (
  seller_name text, seller_city text, whatsapp text, sold_count integer,
  id uuid, title text, price numeric, currency text, category public.product_category,
  condition text, cover text, created_at timestamptz
)
language sql stable security definer
set search_path = ''
as $$
  select pr.display_name, pr.city, pr.whatsapp, pr.sold_count,
         p.id, p.title, p.price, p.currency, p.category, p.condition, p.images[1], p.created_at
  from public.profiles pr
  left join public.products p on p.seller_id = pr.id and p.status = 'active'
  where pr.id = sid
    and public.paid_ok(pr.paid_until, pr.suspended, pr.mp_preapproval_status)
    and pr.whatsapp is not null
  order by p.created_at desc nulls last
$$;
grant execute on function public.get_seller_stand(uuid) to anon, authenticated;
