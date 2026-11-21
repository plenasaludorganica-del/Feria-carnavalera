-- WhatsApp de soporte = el WhatsApp cargado por el administrador en su panel.
create or replace function public.get_support_whatsapp()
returns text
language sql stable security definer
set search_path = ''
as $$
  select whatsapp from public.profiles
  where role = 'admin' and whatsapp is not null
  order by created_at
  limit 1
$$;
grant execute on function public.get_support_whatsapp() to anon, authenticated;
