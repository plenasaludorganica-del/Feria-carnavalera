-- Mensajes del botón Ayuda: opinión (anónima) o problema (con contacto opcional).
-- Todo llega solo al panel de administración. Sin WhatsApp de soporte.
alter table public.feedback add column if not exists kind text not null default 'opinion' check (kind in ('opinion','problema'));
alter table public.feedback add column if not exists contact text check (char_length(contact) <= 120);

drop function if exists public.submit_feedback(int, text, text);
create or replace function public.submit_feedback(p_rating int, p_message text, p_page text default null, p_kind text default 'opinion', p_contact text default null)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if p_kind not in ('opinion','problema') then raise exception 'tipo inválido'; end if;
  if p_rating is not null and (p_rating < 1 or p_rating > 5) then raise exception 'puntaje inválido'; end if;
  if p_rating is null and coalesce(trim(p_message), '') = '' then raise exception 'vacío'; end if;
  if (select count(*) from public.feedback where created_at > now() - interval '1 hour') >= 300 then
    raise exception 'demasiados mensajes, probá más tarde';
  end if;
  insert into public.feedback (rating, message, page, kind, contact)
  values (p_rating, nullif(left(trim(coalesce(p_message, '')), 1500), ''), left(p_page, 200), p_kind,
          nullif(left(trim(coalesce(p_contact, '')), 120), ''));
end $$;
revoke execute on function public.submit_feedback(int, text, text, text, text) from public;
grant execute on function public.submit_feedback(int, text, text, text, text) to anon, authenticated;

drop function if exists public.get_support_whatsapp();
