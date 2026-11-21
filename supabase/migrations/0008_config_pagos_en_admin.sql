-- Configuración de pagos desde el panel de administración (sin tocar Cloudflare).
-- * Claves (token de Mercado Pago, clave del webhook) → Supabase Vault (cifradas).
-- * Precio de la cuota → tabla app_settings.
-- Solo un admin puede cargarlas; solo el servidor (service_role) puede leer las claves.

create table if not exists public.app_settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
revoke all on public.app_settings from anon, authenticated;

create or replace function public.admin_set_secret(p_name text, p_value text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_full text := 'feria_' || p_name;
begin
  if not public.is_admin() then raise exception 'solo administradores'; end if;
  if p_name not in ('mp_access_token', 'mp_webhook_secret') then raise exception 'clave no permitida'; end if;
  if coalesce(trim(p_value), '') = '' then raise exception 'valor vacío'; end if;
  select id into v_id from vault.secrets where name = v_full;
  if v_id is null then
    perform vault.create_secret(trim(p_value), v_full, 'Feria del Comparsero');
  else
    perform vault.update_secret(v_id, trim(p_value));
  end if;
end $$;

create or replace function public.admin_secret_status()
returns table (name text, configured boolean, last4 text, updated_at timestamptz)
language sql stable security definer
set search_path = ''
as $$
  select n.name,
         s.decrypted_secret is not null,
         right(s.decrypted_secret, 4),
         s.updated_at
  from (values ('mp_access_token'), ('mp_webhook_secret')) as n(name)
  left join vault.decrypted_secrets s on s.name = 'feria_' || n.name
  where public.is_admin()
$$;

create or replace function public.get_app_secret(p_name text)
returns text
language sql stable security definer
set search_path = ''
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'feria_' || p_name
$$;

create or replace function public.admin_set_setting(p_key text, p_value text)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'solo administradores'; end if;
  if p_key not in ('monthly_price') then raise exception 'ajuste no permitido'; end if;
  if p_key = 'monthly_price' and (p_value !~ '^[0-9]+(\.[0-9]{1,2})?$' or p_value::numeric <= 0) then
    raise exception 'precio inválido';
  end if;
  insert into public.app_settings (key, value) values (p_key, p_value)
  on conflict (key) do update set value = excluded.value, updated_at = now();
end $$;

create or replace function public.get_monthly_price()
returns numeric
language sql stable security definer
set search_path = ''
as $$ select value::numeric from public.app_settings where key = 'monthly_price' $$;

revoke execute on function public.admin_set_secret(text, text) from public, anon;
revoke execute on function public.admin_secret_status() from public, anon;
revoke execute on function public.get_app_secret(text) from public, anon, authenticated;
revoke execute on function public.admin_set_setting(text, text) from public, anon;
grant execute on function public.admin_set_secret(text, text) to authenticated;
grant execute on function public.admin_secret_status() to authenticated;
grant execute on function public.get_app_secret(text) to service_role;
grant execute on function public.admin_set_setting(text, text) to authenticated;
grant execute on function public.get_monthly_price() to anon, authenticated;
