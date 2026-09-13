alter table public.passenger
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

create index if not exists passenger_auth_user_id_idx
  on public.passenger (auth_user_id);

-- Historical passenger rows remain unchanged. New authenticated passenger rows
-- are linked by FastAPI using the verified Supabase access-token subject.
