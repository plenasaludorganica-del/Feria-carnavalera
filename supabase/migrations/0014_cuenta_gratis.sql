-- Cuentas gratis: el admin las libera de pagar hasta una fecha.
alter table public.profiles add column if not exists is_free boolean not null default false;

create or replace function public.admin_set_free(uid uuid, until date)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'solo administradores'; end if;
  update public.profiles set paid_until = until, is_free = true where id = uid;
  insert into public.payments (user_id, provider, status, period_end, raw)
  values (uid, 'gratis', 'manual', until, jsonb_build_object('by', auth.uid(), 'note', 'cuenta gratis'));
end $$;
revoke execute on function public.admin_set_free(uuid, date) from public, anon;
grant execute on function public.admin_set_free(uuid, date) to authenticated;

-- Cobro manual = pagó: deja de ser "gratis"
create or replace function public.admin_set_paid_until(uid uuid, until date, note text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'solo administradores'; end if;
  update public.profiles set paid_until = until, is_free = false where id = uid;
  insert into public.payments (user_id, provider, status, period_end, raw)
  values (uid, 'manual', 'manual', until, jsonb_build_object('by', auth.uid(), 'note', note));
end $$;

-- La vista del admin muestra si es gratis
drop function if exists public.admin_list_sellers();
drop view if exists public.admin_sellers;
create view public.admin_sellers
with (security_invoker = true) as
select p.id, p.display_name, u.email, p.whatsapp, p.city, p.role, p.paid_until, p.suspended,
       p.admin_note, p.created_at, p.mp_preapproval_status,
       public.subscription_state(p) as state,
       (select count(*) from public.products x where x.seller_id = p.id) as products_count,
       (select max(created_at) from public.payments y where y.user_id = p.id and y.status in ('approved','manual')) as last_payment_at,
       p.sold_count, p.is_free
from public.profiles p
join auth.users u on u.id = p.id;
revoke all on public.admin_sellers from anon, authenticated;

create or replace function public.admin_list_sellers()
returns setof public.admin_sellers
language sql stable security definer set search_path = '' as $$
  select * from public.admin_sellers where public.is_admin() order by created_at desc
$$;
revoke execute on function public.admin_list_sellers() from public, anon;
grant execute on function public.admin_list_sellers() to authenticated;

-- Si una cuenta gratis paga por Mercado Pago, deja de figurar como gratis.
create or replace function public.clear_free_on_payment()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.provider = 'mercadopago' and new.status = 'approved' then
    update public.profiles set is_free = false where id = new.user_id;
  end if;
  return new;
end $$;
drop trigger if exists payments_clear_free on public.payments;
create trigger payments_clear_free after insert or update of status on public.payments
  for each row execute function public.clear_free_on_payment();
revoke execute on function public.clear_free_on_payment() from public, anon, authenticated;
