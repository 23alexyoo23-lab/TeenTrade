-- TeenTrade schema (PRD section 11).
--
-- Run this once against your Supabase project: Dashboard -> SQL Editor ->
-- New query -> paste the whole file -> Run.
--
-- Identity lives in Clerk. This schema holds the TeenTrade profile and links it
-- to the Clerk account through users.clerk_id.
--
-- ===========================================================================
-- READ THIS BEFORE RUNNING
--
-- Part 1 DROPS these tables and everything in them. That is deliberate: it
-- makes the script re-runnable, and it clears the old starter's `users` table,
-- which has a different shape and would otherwise make Part 2 fail with
-- "column username does not exist".
--
-- On a fresh project this drops nothing. On a project with real data you care
-- about, back it up first — or delete Part 1 and run Part 2 alone.
-- ===========================================================================


/* ========================================================================== */
/* Part 1 — clear any previous version (DESTRUCTIVE)                          */
/* ========================================================================== */

drop table if exists public.analytics_events cascade;
drop table if exists public.notifications    cascade;
drop table if exists public.reviews          cascade;
drop table if exists public.messages         cascade;
drop table if exists public.conversations    cascade;
drop table if exists public.listing_views    cascade;
drop table if exists public.blocks           cascade;
drop table if exists public.saved_items      cascade;
drop table if exists public.reports          cascade;
drop table if exists public.offers           cascade;
drop table if exists public.listing_images   cascade;
drop table if exists public.listings         cascade;
drop table if exists public.users            cascade;

drop function if exists public.increment_listing_view_count(uuid);
drop function if exists public.adjust_listing_save_count(uuid, integer);


/* ========================================================================== */
/* Part 2 — create the schema                                                 */
/* ========================================================================== */

create extension if not exists "pgcrypto";

/* -------------------------------------------------------------------------- */
/* users (11.2)                                                               */
/* -------------------------------------------------------------------------- */

create table public.users (
  id                      uuid primary key,
  -- The Clerk account this profile belongs to. Clerk owns credentials; there
  -- is deliberately no password column here.
  clerk_id                text unique not null,
  username                text unique not null,
  email                   text not null,
  date_of_birth           date not null,
  avatar_url              text,
  region                  text not null default 'central',
  account_status          text not null default 'active',
  rating_average          numeric(2,1),
  rating_count            integer not null default 0,
  last_active_at          timestamptz not null default now(),
  created_at              timestamptz not null default now(),
  deleted_at              timestamptz,

  constraint users_region_check
    check (region in ('north','south','east','west','central')),
  constraint users_account_status_check
    check (account_status in ('active','suspended','deleted'))
);

create index users_clerk_id_idx on public.users (clerk_id);
create index users_username_idx on public.users (lower(username));

/* -------------------------------------------------------------------------- */
/* listings (11.3)                                                            */
/* -------------------------------------------------------------------------- */

create table public.listings (
  id                 uuid primary key,
  seller_id          uuid not null references public.users(id) on delete cascade,
  title              text not null,
  description        text not null default '',
  -- Categories are a fixed tree in src/lib/constants.ts, not a table.
  category_id        integer not null,
  condition          text not null default 'good',
  size               text,
  colour             text,
  brand              text,
  price_cents        integer,
  transaction_types  text[] not null default '{}',
  accepts_offers     boolean not null default true,
  region             text not null default 'central',
  status             text not null default 'draft',
  view_count         integer not null default 0,
  save_count         integer not null default 0,
  moderation_note    text,
  reserved_until     timestamptz,
  published_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz,

  constraint listings_condition_check
    check (condition in ('new','like_new','good','fair')),
  constraint listings_status_check
    check (status in ('draft','pending_review','active','reserved','sold','removed')),
  constraint listings_region_check
    check (region in ('north','south','east','west','central'))
);

create index listings_browse_idx on public.listings (status, deleted_at, published_at desc);
create index listings_seller_idx on public.listings (seller_id);
create index listings_category_idx on public.listings (category_id);

/* -------------------------------------------------------------------------- */
/* listing_images (11.4)                                                      */
/* -------------------------------------------------------------------------- */

create table public.listing_images (
  id             uuid primary key,
  listing_id     uuid not null references public.listings(id) on delete cascade,
  url            text not null,
  thumbnail_url  text not null,
  position       integer not null default 0,
  created_at     timestamptz not null default now()
);

create index listing_images_listing_idx on public.listing_images (listing_id, position);

/* -------------------------------------------------------------------------- */
/* offers (11.5)                                                              */
/* -------------------------------------------------------------------------- */

create table public.offers (
  id                   uuid primary key,
  listing_id           uuid not null references public.listings(id) on delete cascade,
  offerer_id           uuid not null references public.users(id) on delete cascade,
  offer_type           text not null,
  offered_price_cents  integer,
  offered_listing_ids  uuid[],
  cash_topup_cents     integer,
  message              text,
  meetup_location_id   integer,
  proposed_meetup_at   timestamptz,
  status               text not null default 'pending',
  -- Set once each side confirms the handover happened (9.4).
  completed_by         uuid[] not null default '{}',
  expires_at           timestamptz not null,
  created_at           timestamptz not null default now(),

  constraint offers_type_check
    check (offer_type in ('purchase','price_offer','trade')),
  constraint offers_status_check
    check (status in ('pending','accepted','declined','countered','expired','completed'))
);

create index offers_listing_idx on public.offers (listing_id);
create index offers_offerer_idx on public.offers (offerer_id, created_at desc);
create index offers_expiry_idx on public.offers (status, expires_at);

/* -------------------------------------------------------------------------- */
/* reports (11.6)                                                             */
/* -------------------------------------------------------------------------- */

create table public.reports (
  id               uuid primary key,
  reporter_id      uuid not null references public.users(id) on delete cascade,
  target_type      text not null,
  target_id        uuid not null,
  reason           text not null,
  details          text not null default '',
  attachment_url   text,
  status           text not null default 'open',
  resolution_note  text,
  resolved_by      uuid,
  created_at       timestamptz not null default now(),
  resolved_at      timestamptz,

  constraint reports_target_type_check check (target_type in ('listing','user','message')),
  constraint reports_status_check check (status in ('open','in_review','resolved','dismissed'))
);

create index reports_target_idx on public.reports (target_type, target_id, status);
create index reports_reporter_idx on public.reports (reporter_id, created_at desc);

/* -------------------------------------------------------------------------- */
/* saved_items, blocks, listing_views — composite keys                        */
/* -------------------------------------------------------------------------- */

create table public.saved_items (
  user_id     uuid not null references public.users(id) on delete cascade,
  listing_id  uuid not null references public.listings(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create table public.blocks (
  blocker_id  uuid not null references public.users(id) on delete cascade,
  blocked_id  uuid not null references public.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

create index blocks_blocked_idx on public.blocks (blocked_id);

create table public.listing_views (
  user_id     uuid not null references public.users(id) on delete cascade,
  listing_id  uuid not null references public.listings(id) on delete cascade,
  viewed_at   timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create index listing_views_recent_idx on public.listing_views (user_id, viewed_at desc);

/* -------------------------------------------------------------------------- */
/* conversations and messages (12.5)                                          */
/* -------------------------------------------------------------------------- */

create table public.conversations (
  id               uuid primary key,
  listing_id       uuid references public.listings(id) on delete set null,
  offer_id         uuid references public.offers(id) on delete set null,
  participant_ids  uuid[] not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Supports the `contains(participant_ids, [...])` lookups in data.ts.
create index conversations_participants_idx
  on public.conversations using gin (participant_ids);
create index conversations_updated_idx on public.conversations (updated_at desc);

create table public.messages (
  id               uuid primary key,
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  sender_id        uuid not null references public.users(id) on delete cascade,
  body             text not null,
  -- True when the outbound scanner stripped contact details (10.1).
  redacted         boolean not null default false,
  kind             text not null default 'text',
  read_by          uuid[] not null default '{}',
  created_at       timestamptz not null default now(),

  constraint messages_kind_check check (kind in ('text','system'))
);

create index messages_conversation_idx on public.messages (conversation_id, created_at);

/* -------------------------------------------------------------------------- */
/* reviews, notifications, analytics                                          */
/* -------------------------------------------------------------------------- */

create table public.reviews (
  id          uuid primary key,
  offer_id    uuid not null references public.offers(id) on delete cascade,
  author_id   uuid not null references public.users(id) on delete cascade,
  subject_id  uuid not null references public.users(id) on delete cascade,
  rating      integer not null check (rating between 1 and 5),
  body        text not null default '',
  created_at  timestamptz not null default now(),

  unique (offer_id, author_id)
);

create index reviews_subject_idx on public.reviews (subject_id, created_at desc);

create table public.notifications (
  id          uuid primary key,
  user_id     uuid not null references public.users(id) on delete cascade,
  kind        text not null,
  title       text not null,
  body        text not null default '',
  href        text,
  read        boolean not null default false,
  created_at  timestamptz not null default now(),

  constraint notifications_kind_check
    check (kind in ('message','offer','listing_status','review','report'))
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);

create table public.analytics_events (
  id          uuid primary key,
  name        text not null,
  user_id     uuid references public.users(id) on delete set null,
  properties  jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index analytics_events_name_idx on public.analytics_events (name, created_at desc);

/* -------------------------------------------------------------------------- */
/* Counters                                                                   */
/* -------------------------------------------------------------------------- */

-- Counted in Postgres so two simultaneous views or saves cannot overwrite each
-- other the way a read-modify-write from the app would. data.ts calls these
-- through supabase.rpc().

create function public.increment_listing_view_count(p_listing_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.listings
     set view_count = view_count + 1
   where id = p_listing_id;
$$;

create function public.adjust_listing_save_count(p_listing_id uuid, p_delta integer)
returns void
language sql
security definer
set search_path = public
as $$
  update public.listings
     set save_count = greatest(0, save_count + p_delta)
   where id = p_listing_id;
$$;

/* -------------------------------------------------------------------------- */
/* Row level security                                                         */
/* -------------------------------------------------------------------------- */

-- The application connects with the service role key, which bypasses RLS, and
-- does its own authorisation in the API layer. RLS is switched on with no
-- policies so that the anon/publishable key — the one that can reach the
-- browser — cannot read or write any of these tables directly.

alter table public.users             enable row level security;
alter table public.listings          enable row level security;
alter table public.listing_images    enable row level security;
alter table public.offers            enable row level security;
alter table public.reports           enable row level security;
alter table public.saved_items       enable row level security;
alter table public.blocks            enable row level security;
alter table public.listing_views     enable row level security;
alter table public.conversations     enable row level security;
alter table public.messages          enable row level security;
alter table public.reviews           enable row level security;
alter table public.notifications     enable row level security;
alter table public.analytics_events  enable row level security;
