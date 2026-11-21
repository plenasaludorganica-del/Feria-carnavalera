-- Nueva regla de cuota: se renueva cada mes EL MISMO DÍA en que pagó.
--   Pagó el 21/11 → vence el 21/12 → el 21/01 → ...
--   * Si paga antes de vencer, se suma un mes a partir del vencimiento (no pierde días).
--   * Si paga después de vencer, arranca de nuevo desde el día que pagó.
--   paid_until = fecha de vencimiento (ese día todavía está activo).

create or replace function public.add_month(d date)
returns date
language sql immutable
set search_path = ''
as $$ select (d + interval '1 month')::date $$;

create or replace function public.register_payment(
  p_user_id uuid,
  p_mp_payment_id text,
  p_status text,
  p_amount numeric,
  p_currency text,
  p_preference_id text default null,
  p_raw jsonb default null
) returns date
language plpgsql security definer
set search_path = ''
as $$
declare
  v_prev_status text;
  v_current     date;
  v_start       date;
  v_end         date;
begin
  select paid_until into v_current from public.profiles where id = p_user_id for update;
  if not found then raise exception 'perfil % inexistente', p_user_id; end if;

  select status, period_end into v_prev_status, v_end
  from public.payments where mp_payment_id = p_mp_payment_id;

  if v_prev_status = 'approved' then
    return v_end;                          -- ya acreditado: no suma dos veces
  end if;

  if p_status <> 'approved' then
    insert into public.payments (user_id, mp_payment_id, mp_preference_id, status, amount, currency, raw)
    values (p_user_id, p_mp_payment_id, p_preference_id, p_status, p_amount, p_currency, p_raw)
    on conflict (mp_payment_id) do update set status = excluded.status, raw = excluded.raw;
    return null;
  end if;

  -- Al día → un mes más desde su vencimiento. Vencido o nuevo → un mes desde hoy.
  v_start := greatest(coalesce(v_current, public.app_today()), public.app_today());
  v_end   := public.add_month(v_start);

  insert into public.payments (user_id, mp_payment_id, mp_preference_id, status, amount, currency,
                               period_start, period_end, raw)
  values (p_user_id, p_mp_payment_id, p_preference_id, 'approved', p_amount, p_currency,
          v_start, v_end, p_raw)
  on conflict (mp_payment_id) do update
    set status = 'approved', period_start = excluded.period_start,
        period_end = excluded.period_end, raw = excluded.raw;

  update public.profiles set paid_until = v_end where id = p_user_id;
  return v_end;
end $$;
revoke all on function public.register_payment from public, anon, authenticated;
grant execute on function public.register_payment to service_role;

-- Cobro manual del admin: deja la cuota paga hasta la fecha exacta que elija.
create or replace function public.admin_set_paid_until(uid uuid, until date, note text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'solo administradores'; end if;
  update public.profiles set paid_until = until where id = uid;
  insert into public.payments (user_id, provider, status, period_end, raw)
  values (uid, 'manual', 'manual', until, jsonb_build_object('by', auth.uid(), 'note', note));
end $$;
revoke execute on function public.admin_set_paid_until(uuid, date, text) from public, anon;
grant execute on function public.admin_set_paid_until(uuid, date, text) to authenticated;

comment on column public.profiles.paid_until is
  'Fecha de vencimiento de la cuota (ese día sigue activo). Se renueva cada mes el mismo día.';
