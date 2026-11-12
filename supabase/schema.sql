-- Run once in Supabase SQL Editor, or let cms:upload run it using DATABASE_URL.
create table if not exists public.site_pages (
 id text primary key, title text not null, html text not null,
 published boolean not null default true, updated_at timestamptz not null default now()
);
create table if not exists public.events (
 id text primary key, title text not null, description text not null default '',
 image text, venue text not null default '', category text not null default 'event',
 date timestamptz not null, end_date timestamptz, photos jsonb not null default '[]',
 speakers jsonb not null default '[]', published boolean not null default true, sort_order integer not null default 0
);
create table if not exists public.speakers (
 id text primary key, name text not null, role text not null default '', image text, linkedin text,
 published boolean not null default true, sort_order integer not null default 0
);
create table if not exists public.site_settings (
 key text primary key, value jsonb not null, published boolean not null default true
);
alter table public.site_pages enable row level security;
alter table public.events enable row level security;
alter table public.speakers enable row level security;
alter table public.site_settings enable row level security;
drop policy if exists public_read_published on public.site_pages;
create policy public_read_published on public.site_pages for select to anon, authenticated using(published);
drop policy if exists public_read_published on public.events;
create policy public_read_published on public.events for select to anon, authenticated using(published);
drop policy if exists public_read_published on public.speakers;
create policy public_read_published on public.speakers for select to anon, authenticated using(published);
drop policy if exists public_read_published on public.site_settings;
create policy public_read_published on public.site_settings for select to anon, authenticated using(published);
grant select on public.site_pages, public.events, public.speakers, public.site_settings to anon, authenticated;
revoke insert,update,delete on public.site_pages,public.events,public.speakers,public.site_settings from anon,authenticated;
-- Storage is provisioned by cms:upload. Public bucket reads are intentional;
-- uploads use the server-side service key. No anonymous upload policy is created.
