create table if not exists public.games (
 id uuid primary key default gen_random_uuid(), slug text not null unique, title text not null, store text not null check (store in ('Epic Games','Steam','GOG','Prime Gaming')), description text not null default '', image_url text not null, claim_url text not null, original_price numeric(10,2) not null default 0, starts_at timestamptz not null, ends_at timestamptz not null, genres text[] not null default '{}', featured boolean not null default false, is_active boolean not null default true, source_id text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists games_active_ends_idx on public.games (is_active, ends_at);
alter table public.games enable row level security;
revoke all on table public.games from anon, authenticated;
grant select on table public.games to anon, authenticated;
create policy "active games are public" on public.games for select to anon, authenticated using (is_active and ends_at > now());
