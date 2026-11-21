-- Precio promocional opcional (si existe, es lo que se cobra).
create or replace function public.admin_set_setting(p_key text, p_value text)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'solo administradores'; end if;
  if p_key not in ('monthly_price', 'promo_price') then raise exception 'ajuste no permitido'; end if;
  if p_key = 'promo_price' and coalesce(p_value, '') = '' then
    delete from public.app_settings where key = 'promo_price';
    return;
  end if;
  if p_value !~ '^[0-9]+(\.[0-9]{1,2})?$' or p_value::numeric <= 0 then
    raise exception 'precio inválido';
  end if;
  insert into public.app_settings (key, value) values (p_key, p_value)
  on conflict (key) do update set value = excluded.value, updated_at = now();
end $$;

create or replace function public.get_promo_price()
returns numeric
language sql stable security definer
set search_path = ''
as $$ select value::numeric from public.app_settings where key = 'promo_price' $$;
grant execute on function public.get_promo_price() to anon, authenticated;

-- Promo de lanzamiento: 50% OFF
insert into public.app_settings (key, value) values ('promo_price', '1999')
on conflict (key) do update set value = excluded.value, updated_at = now();
