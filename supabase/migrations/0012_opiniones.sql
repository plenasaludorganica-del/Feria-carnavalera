-- Opiniones anónimas de visitantes. Nadie puede leerlas salvo el admin.
create table if not exists public.feedback (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  rating     smallint check (rating between 1 and 5),
  message    text check (char_length(message) <= 1500),
  page       text,
  read       boolean not null default false,
  check (rating is not null or coalesce(trim(message), '') <> '')
);
alter table public.feedback enable row level security;
revoke all on public.feedback from anon, authenticated;

-- Enviar (cualquiera). No guarda usuario ni IP: anónimo.
create or replace function public.submit_feedback(p_rating int, p_message text, p_page text default null)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if p_rating is not null and (p_rating < 1 or p_rating > 5) then raise exception 'puntaje inválido'; end if;
  if p_rating is null and coalesce(trim(p_message), '') = '' then raise exception 'vacío'; end if;
  -- freno simple contra abuso: máximo 300 opiniones por hora en total
  if (select count(*) from public.feedback where created_at > now() - interval '1 hour') >= 300 then
    raise exception 'demasiadas opiniones, probá más tarde';
  end if;
  insert into public.feedback (rating, message, page)
  values (p_rating, nullif(left(trim(coalesce(p_message, '')), 1500), ''), left(p_page, 200));
end $$;
revoke execute on function public.submit_feedback(int, text, text) from public;
grant execute on function public.submit_feedback(int, text, text) to anon, authenticated;

-- Leer y marcar como leídas (solo admin)
create or replace function public.admin_list_feedback()
returns setof public.feedback
language sql stable security definer set search_path = '' as $$
  select * from public.feedback where public.is_admin() order by created_at desc limit 500
$$;
create or replace function public.admin_mark_feedback_read(p_id bigint, p_read boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'solo administradores'; end if;
  update public.feedback set read = p_read where id = p_id;
end $$;
revoke execute on function public.admin_list_feedback() from public, anon;
revoke execute on function public.admin_mark_feedback_read(bigint, boolean) from public, anon;
grant execute on function public.admin_list_feedback() to authenticated;
grant execute on function public.admin_mark_feedback_read(bigint, boolean) to authenticated;
