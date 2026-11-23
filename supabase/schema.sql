-- SWAR AI Supabase schema
-- Run in Supabase SQL editor. Adjust as needed for your project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  phone text,
  name text,
  preferred_language text default 'en-IN',
  auto_detect_language boolean default false,
  speech_rate numeric default 1,
  easy_mode boolean default false,
  theme text default 'dark',
  memory_consent boolean default false,
  save_history boolean default true,
  save_audio boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  language text default 'en-IN',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  language text,
  suggestions jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  source text default 'chat',
  created_at timestamptz default now()
);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  event_type text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.memories enable row level security;
alter table public.usage_events enable row level security;

-- Profiles
create policy "profiles select own" on public.profiles for select using (auth.uid() = id);
create policy "profiles insert own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles update own" on public.profiles for update using (auth.uid() = id);

-- Conversations
create policy "conversations select own" on public.conversations for select using (auth.uid() = user_id);
create policy "conversations insert own" on public.conversations for insert with check (auth.uid() = user_id);
create policy "conversations update own" on public.conversations for update using (auth.uid() = user_id);
create policy "conversations delete own" on public.conversations for delete using (auth.uid() = user_id);

-- Messages
create policy "messages select own" on public.messages for select using (auth.uid() = user_id);
create policy "messages insert own" on public.messages for insert with check (auth.uid() = user_id);
create policy "messages delete own" on public.messages for delete using (auth.uid() = user_id);

-- Memories
create policy "memories select own" on public.memories for select using (auth.uid() = user_id);
create policy "memories insert own" on public.memories for insert with check (auth.uid() = user_id);
create policy "memories delete own" on public.memories for delete using (auth.uid() = user_id);

-- Usage events
create policy "usage select own" on public.usage_events for select using (auth.uid() = user_id);
create policy "usage insert own" on public.usage_events for insert with check (auth.uid() = user_id or user_id is null);

-- Updated-at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists conversations_updated_at on public.conversations;
create trigger conversations_updated_at before update on public.conversations
for each row execute function public.set_updated_at();
