-- INOX COMMUNITY · Milestone 1
-- Profili, garage, post con foto, reazioni emoji, follow, salvati, forum, raduni.
-- Contest, punti/badge, classifiche e notifiche arrivano nella migrazione 0002.

create extension if not exists citext;

-- ---------------------------------------------------------------
-- Profili
-- ---------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username citext not null unique
    check (username ~ '^[a-z0-9_\.]{3,24}$'),
  display_name text not null check (char_length(display_name) between 1 and 60),
  city text check (char_length(city) <= 60),
  bio text check (char_length(bio) <= 300),
  avatar_key text,
  cover_key text,
  is_verified_customer boolean not null default false,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- Chi è admin? Security definer per poterla usare nelle policy senza ricorsione.
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Crea il profilo alla registrazione, con lo username scelto nel form.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    lower(new.raw_user_meta_data ->> 'username'),
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), new.raw_user_meta_data ->> 'username')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

create policy "profili visibili a tutti" on public.profiles
  for select using (true);
create policy "ognuno modifica il proprio profilo" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Il badge cliente verificato e il ruolo li cambia solo un admin:
-- gli utenti possono aggiornare soltanto le colonne elencate qui.
revoke update on public.profiles from authenticated;
grant update (display_name, city, bio, avatar_key, cover_key) on public.profiles to authenticated;

-- Assegnare o togliere il badge: solo admin, dalla dashboard /admin.
create or replace function public.set_verified_customer(target uuid, verified boolean)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo gli amministratori possono verificare i clienti';
  end if;
  update public.profiles set is_verified_customer = verified where id = target;
end;
$$;
revoke execute on function public.set_verified_customer(uuid, boolean) from public, anon;
grant execute on function public.set_verified_customer(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------
-- Garage
-- ---------------------------------------------------------------
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  make text not null check (char_length(make) <= 40),
  model text not null check (char_length(model) <= 60),
  year smallint check (year between 1900 and 2100),
  engine text check (char_length(engine) <= 80),
  mods text check (char_length(mods) <= 2000),
  cover_key text,
  created_at timestamptz not null default now()
);
create index vehicles_owner_idx on public.vehicles (owner_id);

alter table public.vehicles enable row level security;
create policy "garage visibili a tutti" on public.vehicles for select using (true);
create policy "gestisco le mie auto" on public.vehicles
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------
-- Post e media
-- ---------------------------------------------------------------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  vehicle_id uuid references public.vehicles (id) on delete set null,
  caption text check (char_length(caption) <= 1000),
  city text check (char_length(city) <= 60),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index posts_feed_idx on public.posts (created_at desc) where deleted_at is null;
create index posts_author_idx on public.posts (author_id, created_at desc);

create table public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  kind text not null check (kind in ('image', 'video')),
  storage_key text not null,
  width int,
  height int,
  duration_s numeric(4,1) check (duration_s is null or duration_s <= 20),
  position smallint not null default 0
);
create index post_media_post_idx on public.post_media (post_id, position);

alter table public.posts enable row level security;
create policy "post visibili" on public.posts
  for select using (deleted_at is null or author_id = auth.uid() or public.is_admin());
create policy "pubblico come me stesso" on public.posts
  for insert with check (author_id = auth.uid());
create policy "modifico i miei post" on public.posts
  for update using (author_id = auth.uid() or public.is_admin());

alter table public.post_media enable row level security;
create policy "media visibili" on public.post_media for select using (true);
create policy "media dei miei post" on public.post_media
  for insert with check (
    exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid())
  );

-- ---------------------------------------------------------------
-- Reazioni: una per utente per post, qualsiasi emoji
-- ---------------------------------------------------------------
create table public.reactions (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  emoji text not null check (char_length(emoji) between 1 and 16),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index reactions_post_idx on public.reactions (post_id);

alter table public.reactions enable row level security;
create policy "reazioni visibili" on public.reactions for select using (true);
create policy "le mie reazioni" on public.reactions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create view public.post_reaction_counts
with (security_invoker = true) as
  select post_id, emoji, count(*)::int as total
  from public.reactions
  group by post_id, emoji;

-- ---------------------------------------------------------------
-- Follow e salvati
-- ---------------------------------------------------------------
create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index follows_following_idx on public.follows (following_id);

alter table public.follows enable row level security;
create policy "follow visibili" on public.follows for select using (true);
create policy "i miei follow" on public.follows
  for all using (follower_id = auth.uid()) with check (follower_id = auth.uid());

create table public.saved_posts (
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
alter table public.saved_posts enable row level security;
create policy "i miei salvati" on public.saved_posts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------
-- Forum
-- ---------------------------------------------------------------
create table public.forum_categories (
  id serial primary key,
  slug text not null unique,
  name text not null,
  description text,
  position smallint not null default 0
);

create table public.forum_threads (
  id uuid primary key default gen_random_uuid(),
  category_id int not null references public.forum_categories (id),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 140),
  body text not null check (char_length(body) <= 10000),
  is_locked boolean not null default false,
  created_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index forum_threads_cat_idx on public.forum_threads (category_id, last_activity_at desc);

create table public.forum_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.forum_threads (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index forum_replies_thread_idx on public.forum_replies (thread_id, created_at);

create or replace function public.touch_thread()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  update public.forum_threads set last_activity_at = now() where id = new.thread_id;
  return new;
end;
$$;
create trigger on_forum_reply after insert on public.forum_replies
  for each row execute function public.touch_thread();

alter table public.forum_categories enable row level security;
create policy "categorie visibili" on public.forum_categories for select using (true);
create policy "categorie gestite da admin" on public.forum_categories
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.forum_threads enable row level security;
create policy "discussioni visibili" on public.forum_threads
  for select using (deleted_at is null or public.is_admin());
create policy "apro discussioni" on public.forum_threads
  for insert with check (author_id = auth.uid());
create policy "modifico le mie discussioni" on public.forum_threads
  for update using (author_id = auth.uid() or public.is_admin());

alter table public.forum_replies enable row level security;
create policy "risposte visibili" on public.forum_replies
  for select using (deleted_at is null or public.is_admin());
create policy "rispondo se non è chiusa" on public.forum_replies
  for insert with check (
    author_id = auth.uid()
    and exists (select 1 from public.forum_threads t where t.id = thread_id and not t.is_locked)
  );
create policy "modifico le mie risposte" on public.forum_replies
  for update using (author_id = auth.uid() or public.is_admin());

insert into public.forum_categories (slug, name, description, position) values
  ('presentazioni', 'Presentazioni', 'Presentati e mostra la tua auto', 1),
  ('scarichi', 'Scarichi e sound', 'Impianti, terminali, sound', 2),
  ('elaborazioni', 'Elaborazioni', 'Motore, assetto, estetica', 3),
  ('raduni', 'Raduni ed eventi', 'Organizzazione e resoconti', 4),
  ('mercatino', 'Mercatino', 'Compro, vendo, scambio', 5);

-- ---------------------------------------------------------------
-- Raduni
-- ---------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null check (char_length(title) <= 120),
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  venue text not null,
  city text not null,
  lat double precision,
  lng double precision,
  is_official boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index events_starts_idx on public.events (starts_at);

create table public.event_attendees (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

alter table public.events enable row level security;
create policy "raduni visibili" on public.events for select using (true);
create policy "raduni gestiti da admin" on public.events
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.event_attendees enable row level security;
create policy "partecipanti visibili" on public.event_attendees for select using (true);
create policy "la mia partecipazione" on public.event_attendees
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
