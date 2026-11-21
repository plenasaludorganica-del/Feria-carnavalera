-- Diagnóstico temporal: qué ve cada navegador (para depurar efectos en celulares).
create table if not exists public.client_diag (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  data jsonb not null
);
alter table public.client_diag enable row level security;
revoke all on public.client_diag from anon, authenticated;
