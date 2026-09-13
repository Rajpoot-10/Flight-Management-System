create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'passenger',
  created_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('passenger', 'admin'))
);

alter table public.profiles enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can create their passenger profile" on public.profiles;
create policy "Users can create their passenger profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id and role = 'passenger');

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), 'passenger')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Promote an existing user manually after verifying their identity:
-- update public.profiles set role = 'admin' where id = '<USER_UUID>';
