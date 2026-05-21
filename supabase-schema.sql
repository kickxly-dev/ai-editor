-- CourtIQ NBA 2K26 Platform Schema
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- =============================================
-- PROFILES
-- =============================================
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  username text unique,
  avatar_url text,
  bio text,
  is_verified boolean default false,
  is_premium boolean default false,
  total_builds integer default 0,
  total_likes integer default 0,
  followers integer default 0,
  following integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- =============================================
-- BUILDS
-- =============================================
create table if not exists builds (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  position text not null check (position in ('PG', 'SG', 'SF', 'PF', 'C')),
  archetype text,
  height text,
  weight integer,
  wingspan text,
  takeover text,
  attributes jsonb default '{}',
  badges jsonb default '[]',
  image_url text,
  description text,
  tags text[] default '{}',
  category text default 'Park',
  likes integer default 0,
  saves integer default 0,
  views integer default 0,
  is_public boolean default true,
  ai_analysis jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table builds enable row level security;
create policy "Public builds viewable by everyone" on builds for select using (is_public = true or auth.uid() = user_id);
create policy "Users can insert own builds" on builds for insert with check (auth.uid() = user_id);
create policy "Users can update own builds" on builds for update using (auth.uid() = user_id);
create policy "Users can delete own builds" on builds for delete using (auth.uid() = user_id);

create index builds_user_id_idx on builds(user_id);
create index builds_position_idx on builds(position);
create index builds_category_idx on builds(category);
create index builds_likes_idx on builds(likes desc);
create index builds_created_at_idx on builds(created_at desc);
create index builds_tags_idx on builds using gin(tags);
create index builds_search_idx on builds using gin(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(archetype, '')));

-- =============================================
-- BUILD LIKES
-- =============================================
create table if not exists build_likes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  build_id uuid references builds(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, build_id)
);

alter table build_likes enable row level security;
create policy "Likes viewable by everyone" on build_likes for select using (true);
create policy "Users can like builds" on build_likes for insert with check (auth.uid() = user_id);
create policy "Users can unlike builds" on build_likes for delete using (auth.uid() = user_id);

-- =============================================
-- BUILD SAVES
-- =============================================
create table if not exists build_saves (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  build_id uuid references builds(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, build_id)
);

alter table build_saves enable row level security;
create policy "Saves viewable by owner" on build_saves for select using (auth.uid() = user_id);
create policy "Users can save builds" on build_saves for insert with check (auth.uid() = user_id);
create policy "Users can unsave builds" on build_saves for delete using (auth.uid() = user_id);

-- =============================================
-- COMMENTS
-- =============================================
create table if not exists comments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  build_id uuid references builds(id) on delete cascade not null,
  content text not null,
  likes integer default 0,
  created_at timestamptz default now()
);

alter table comments enable row level security;
create policy "Comments viewable by everyone" on comments for select using (true);
create policy "Users can insert comments" on comments for insert with check (auth.uid() = user_id);
create policy "Users can delete own comments" on comments for delete using (auth.uid() = user_id);

create index comments_build_id_idx on comments(build_id);

-- =============================================
-- COACH SESSIONS
-- =============================================
create table if not exists coach_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  build_id uuid references builds(id) on delete set null,
  title text default 'Coaching Session',
  messages jsonb default '[]',
  total_messages integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table coach_sessions enable row level security;
create policy "Users can view own sessions" on coach_sessions for select using (auth.uid() = user_id);
create policy "Users can create sessions" on coach_sessions for insert with check (auth.uid() = user_id);
create policy "Users can update own sessions" on coach_sessions for update using (auth.uid() = user_id);
create policy "Users can delete own sessions" on coach_sessions for delete using (auth.uid() = user_id);

-- =============================================
-- META TRENDS
-- =============================================
create table if not exists meta_trends (
  id uuid default uuid_generate_v4() primary key,
  category text not null check (category in ('build', 'badge', 'animation', 'takeover')),
  name text not null,
  tier text not null check (tier in ('S', 'A', 'B', 'C', 'D')),
  usage_rate numeric(5,2) default 0,
  win_rate numeric(5,2) default 0,
  trend text default 'stable' check (trend in ('rising', 'stable', 'falling')),
  description text,
  patch_version text,
  updated_at timestamptz default now()
);

alter table meta_trends enable row level security;
create policy "Meta trends viewable by everyone" on meta_trends for select using (true);

-- =============================================
-- TUTORIALS
-- =============================================
create table if not exists tutorials (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  youtube_id text not null,
  thumbnail_url text,
  category text not null,
  difficulty text default 'Beginner' check (difficulty in ('Beginner', 'Intermediate', 'Advanced')),
  tags text[] default '{}',
  views integer default 0,
  duration text,
  creator text,
  is_featured boolean default false,
  created_at timestamptz default now()
);

alter table tutorials enable row level security;
create policy "Tutorials viewable by everyone" on tutorials for select using (true);

-- =============================================
-- FOLLOWS
-- =============================================
create table if not exists follows (
  id uuid default uuid_generate_v4() primary key,
  follower_id uuid references profiles(id) on delete cascade not null,
  following_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(follower_id, following_id)
);

alter table follows enable row level security;
create policy "Follows viewable by everyone" on follows for select using (true);
create policy "Users can follow" on follows for insert with check (auth.uid() = follower_id);
create policy "Users can unfollow" on follows for delete using (auth.uid() = follower_id);

-- =============================================
-- NOTIFICATIONS
-- =============================================
create table if not exists notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  type text not null,
  title text not null,
  message text,
  link text,
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table notifications enable row level security;
create policy "Users can view own notifications" on notifications for select using (auth.uid() = user_id);
create policy "Users can update own notifications" on notifications for update using (auth.uid() = user_id);

-- =============================================
-- SEED META TRENDS
-- =============================================
insert into meta_trends (category, name, tier, usage_rate, win_rate, trend, description, patch_version) values
  ('build', 'Glass Cleaner Finisher', 'S', 34.2, 62.1, 'rising', 'Dominant rim presence with elite finishing. The go-to center build this season.', '1.08'),
  ('build', 'Shot Creator Guard', 'S', 28.7, 58.4, 'stable', 'Versatile guard with elite shooting and ball handling. Park favorite.', '1.08'),
  ('build', 'Playmaking Shot Creator', 'A', 22.1, 55.2, 'stable', 'Elite playmaker with solid shooting. The comp guard standard.', '1.08'),
  ('build', 'Two-Way Slashing Guard', 'A', 19.8, 54.8, 'rising', 'Defense-first guard that still threatens offensively.', '1.08'),
  ('build', 'Stretch Big', 'A', 17.3, 53.1, 'stable', 'Floor-spacing big that opens lanes for guards.', '1.08'),
  ('build', 'Pure Lock', 'B', 14.2, 51.0, 'falling', 'Elite defender but limited offensive threats in current meta.', '1.08'),
  ('badge', 'Limitless Range', 'S', 67.3, 61.2, 'rising', 'Expands shooting range significantly. Meta-defining badge.', '1.08'),
  ('badge', 'Clamps', 'S', 71.8, 60.8, 'stable', 'Best perimeter defense badge. Essential for any lock.', '1.08'),
  ('badge', 'Dream Shake', 'A', 45.2, 57.4, 'rising', 'Post fade is powerful in current meta.', '1.08'),
  ('badge', 'Posterizer', 'A', 38.9, 56.1, 'stable', 'Activates on contact dunks. High percentage plays.', '1.08'),
  ('badge', 'Quick First Step', 'S', 62.1, 59.3, 'stable', 'Enhances blow-by speed. Essential for guards.', '1.08'),
  ('animation', 'Dribble: Pro 3', 'S', 58.4, 61.0, 'rising', 'Tightest dribble package for guards this patch.', '1.08'),
  ('animation', 'Jumpshot: Base 98', 'S', 44.7, 62.3, 'rising', 'Fastest release window in current meta.', '1.08'),
  ('animation', 'Post Fade: Dream', 'A', 29.3, 57.2, 'stable', 'Most effective post fade animation.', '1.08'),
  ('takeover', 'Limitless Shooter', 'S', 39.2, 63.1, 'rising', 'Extends range dramatically. Pairs with any shooting build.', '1.08'),
  ('takeover', 'Rim Protector', 'A', 28.7, 57.8, 'stable', 'Dominant at the rim when activated. Essential for centers.', '1.08');

-- =============================================
-- SEED TUTORIALS
-- =============================================
insert into tutorials (title, description, youtube_id, category, difficulty, tags, views, duration, creator, is_featured) values
  ('Best Dribble Moves for Guards in 2K26', 'Master the most effective dribble combos for guards this season', 'dQw4w9WgXcQ', 'Dribbling', 'Intermediate', '{"guards","dribbling","park"}', 145000, '12:34', 'FlightReacts2K', true),
  ('How to Build a 99 OVR in 2K26', 'Complete guide to reaching 99 overall rating fastest', 'dQw4w9WgXcQ', 'Build Creation', 'Beginner', '{"build","overall","grind"}', 289000, '18:22', 'NBA2KLab', true),
  ('Best Jumpshot 2K26 - Never Miss Again', 'The statistically best jumpshot for every build type', 'dQw4w9WgXcQ', 'Shooting', 'Beginner', '{"jumpshot","shooting","green"}', 421000, '8:45', 'NBA2KLab', true),
  ('Advanced Defense Tutorial - Stop Anyone', 'Learn elite defensive techniques used by top players', 'dQw4w9WgXcQ', 'Defense', 'Advanced', '{"defense","lock","comp"}', 98000, '15:10', 'KingJosiah2K', false),
  ('Park Tips for Beginners', 'How to survive and thrive in NBA 2K26 Park', 'dQw4w9WgXcQ', 'Meta', 'Beginner', '{"park","tips","beginner"}', 67000, '9:30', 'Troydan', false);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'user_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Update build count on profile
create or replace function update_profile_build_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update profiles set total_builds = total_builds + 1 where id = new.user_id;
  elsif TG_OP = 'DELETE' then
    update profiles set total_builds = total_builds - 1 where id = old.user_id;
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create trigger on_build_change
  after insert or delete on builds
  for each row execute procedure update_profile_build_count();

-- Update likes count
create or replace function update_build_likes()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update builds set likes = likes + 1 where id = new.build_id;
    update profiles set total_likes = total_likes + 1
      where id = (select user_id from builds where id = new.build_id);
  elsif TG_OP = 'DELETE' then
    update builds set likes = likes - 1 where id = old.build_id;
    update profiles set total_likes = total_likes - 1
      where id = (select user_id from builds where id = old.build_id);
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create trigger on_build_like
  after insert or delete on build_likes
  for each row execute procedure update_build_likes();

-- Update follower counts
create or replace function update_follow_counts()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update profiles set following = following + 1 where id = new.follower_id;
    update profiles set followers = followers + 1 where id = new.following_id;
  elsif TG_OP = 'DELETE' then
    update profiles set following = following - 1 where id = old.follower_id;
    update profiles set followers = followers - 1 where id = old.following_id;
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create trigger on_follow_change
  after insert or delete on follows
  for each row execute procedure update_follow_counts();
