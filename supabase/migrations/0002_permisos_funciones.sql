-- Postgres da EXECUTE a PUBLIC por defecto en cada función nueva.
-- Cerramos las internas; quedan públicas solo las del catálogo.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_seller_active(uuid) from public, anon;
revoke execute on function public.admin_list_sellers() from public, anon;
revoke execute on function public.admin_set_suspended(uuid, boolean, text) from public, anon;
revoke execute on function public.admin_set_paid_until(uuid, date, text) from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_seller_active(uuid) to authenticated;
