-- "Ya lo vendí": quita la publicación, suma al contador de ventas del vendedor
-- y devuelve las rutas de las fotos para borrarlas de Storage.
alter table public.profiles add column if not exists sold_count integer not null default 0;

create or replace function public.mark_product_sold(pid uuid)
returns text[]
language plpgsql security definer
set search_path = ''
as $$
declare
  v_images text[];
begin
  delete from public.products
   where id = pid and seller_id = auth.uid()
  returning images into v_images;
  if not found then raise exception 'publicación inexistente o ajena'; end if;

  update public.profiles set sold_count = sold_count + 1 where id = auth.uid();
  return v_images;
end $$;

revoke execute on function public.mark_product_sold(uuid) from public, anon;
grant execute on function public.mark_product_sold(uuid) to authenticated;

create or replace view public.admin_sellers
with (security_invoker = true) as
select p.id, p.display_name, u.email, p.whatsapp, p.city, p.role, p.paid_until, p.suspended,
       p.admin_note, p.created_at, p.mp_preapproval_status,
       public.subscription_state(p) as state,
       (select count(*) from public.products x where x.seller_id = p.id) as products_count,
       (select max(created_at) from public.payments y where y.user_id = p.id and y.status in ('approved','manual')) as last_payment_at,
       p.sold_count
from public.profiles p
join auth.users u on u.id = p.id;
revoke all on public.admin_sellers from anon, authenticated;
