-- Plan B para "olvidé mi contraseña": el admin le da al vendedor una
-- contraseña temporal (se la pasa por WhatsApp). No depende del email.
create or replace function public.admin_set_password(uid uuid, new_password text)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'solo administradores'; end if;
  if char_length(new_password) < 8 then raise exception 'mínimo 8 caracteres'; end if;
  update auth.users
     set encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf', 10)),
         email_confirmed_at = coalesce(email_confirmed_at, now()),
         updated_at = now()
   where id = uid;
  if not found then raise exception 'usuario inexistente'; end if;
end $$;

revoke execute on function public.admin_set_password(uuid, text) from public, anon;
grant execute on function public.admin_set_password(uuid, text) to authenticated;
