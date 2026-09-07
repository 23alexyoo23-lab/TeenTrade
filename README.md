# TeenTrade

A teen-only marketplace for Singapore. Users aged 13 to 19 can buy, sell, trade
or give away second-hand items in a moderated, safety-first environment built
for their age group.

This repository implements the TeenTrade product specification: the design
system, component library, screens, user flows, trust and safety layer, data
model and API surface.

---

## Read this first (setup)

This version replaces the earlier starter. It keeps **Clerk** for accounts and
**Supabase** for the database — the same two services as before — but everything
around them is new: all the screens, the API, and the trust and safety layer.

It will **not run until you do the three steps below**, because it needs a real
Clerk project and a real Supabase database.

### 1. Install

```bash
npm install
```

### 2. Create the database tables

In Supabase: **SQL Editor → New query**, paste the whole of
[`supabase/schema.sql`](supabase/schema.sql), and run it.

> Heads up: the old starter had a `users` table with `clerk_id`, `name`,
> `looking_for` and `interests`. This schema is different and much bigger (13
> tables). If your project still has the old `users` table, drop it first, or
> run this against a fresh Supabase project.

### 3. Add your keys

```bash
cp .env.example .env.local
```

Fill in `.env.local` from your Clerk and Supabase dashboards. The one that
catches people out: Supabase needs the **service role** key, not the anon key.
It stays server-side and must never be committed.

Then:

```bash
npm run dev          # http://localhost:3000
```

### How signing up works now

Clerk cannot ask for a date of birth, so signup is two steps:

1. `/signup` — Clerk collects the email and password and creates the account.
2. `/onboarding` — TeenTrade runs the age gate (13 to 19) and takes a username
   and region.

The profile row is written only at the end of step 2. Until then the person has
a Clerk account but no TeenTrade profile, and the app treats them as signed out
so nobody can skip the age check.

### There is no seed data

The old build shipped demo accounts you could log in as with a shared password.
Clerk owns passwords now, so those accounts cannot exist without being created
in Clerk first. **A fresh install starts with an empty marketplace.** Sign up for
an account and post a listing to see the screens with content in them.

### Other things worth knowing

- `npm run typecheck` runs `tsc --noEmit`. It passes.
- `npm run build` needs the Clerk and Supabase variables set, like `dev` does.
- The Clerk webhook (`/api/webhooks/clerk`) is optional. Without it everything
  works; with it, email changes and account deletions in Clerk stay in step with
  the profile.

---

## How it is built

| Concern | Choice |
|---|---|
| Framework | Next.js 16 App Router, React 19, TypeScript |
| Styling | Tailwind v4 with the spec's design tokens as CSS custom properties |
| Data | Supabase (Postgres) behind a repository layer (`src/lib/data.ts`) |
| Auth | Clerk for credentials and sessions; the age gate is ours |
| Images | Compressed client-side to 1600px with a 400px thumbnail |

Note that this project is on **Next.js 16**, where the `middleware.ts` file
convention was renamed to `proxy.ts`. Because the routes live in `src/app`, the
Clerk proxy has to sit at `src/proxy.ts` — Clerk looks for it there and will not
attach the session if it is anywhere else.

### Where things live

```
src/app/                 Routes. Pages are server components; interactivity
                         lives in the client components they render.
  api/v1/                The API surface, matching the spec's endpoints
src/components/          The component library
src/lib/
  types.ts               The data model
  constants.ts           Categories, conditions, regions, meetup locations,
                         prohibited items
  data.ts                Every read and write against Supabase
  store.ts               The Supabase client and query helpers
  auth.ts                Maps the Clerk session onto the TeenTrade profile,
                         plus the age gate
  moderation.ts          Automated listing and message checks
  publish.ts             Validation and moderation on publish
supabase/schema.sql      The database schema — run this once
```

### Where the data layer sits

Every query and mutation goes through `src/lib/data.ts`, and the Supabase client
is isolated in `src/lib/store.ts`. That boundary is why moving from the original
JSON file to Postgres touched those two files and almost nothing else. The types
in `src/lib/types.ts` mirror `supabase/schema.sql` column for column.

Filters that map cleanly onto Postgres (status, seller, region, condition, price)
are pushed into the query. Search-term matching, category-tree walking and the
facet counts stay in TypeScript, so browse and search read a candidate set and
narrow it in the app. That is fine at the scale this is built for; if the
listings table grows past a few thousand rows, `searchListings` is the one
function to move into SQL or a Postgres full-text index.

## What the product does

### Three transaction types

A listing can be for **sale**, open to **trade**, or a **giveaway**. Sell and
Trade combine into a "Sell or Trade" listing; Giveaway is exclusive and clears
the price. This choice drives the badges on cards, the filters, the result tabs
and which action buttons appear on the listing page.

### Age verification

Signup gates on date of birth: under 13 and over 19 are refused. The check runs
client-side for instant feedback and again on the server, and the profile row is
only written once it passes — so the gate cannot be skipped by a half-finished
signup.

### Trust and safety

- Listings are screened on publish: prohibited keywords and price anomalies hold
  the listing for human review, duplicate listings warn, and contact details are
  stripped from descriptions with a visible explanation.
- Messages are scanned the same way before delivery, keeping conversations
  on-platform where they can be moderated.
- Any listing, user or message can be reported. Three independent reports on one
  listing auto-hide it pending review.
- Blocking is silent, mutual in effect, and reversible from Settings: it hides
  listings from feed and search, and closes conversations in both directions.
- Handovers are steered to verified public meetup locations, and meetup details
  are pinned into the chat when an offer is accepted.
- Precise location is never stored or shown, only a region. Real names are never
  shown to other users; people are identified by username alone.

### Payments

TeenTrade does not process payments, and does not intend to. Most users under 18
cannot hold merchant payment accounts, and holding funds would trigger MAS
payment services licensing obligations. Money changes hands in person. This is
stated in the purchase modal, the safety hub and the terms.

## Deliberate limitations

These are choices, not gaps, and each is contained:

- **No object storage.** Images are compressed client-side and stored inline
  with the listing. `POST /api/v1/uploads/presign` keeps the presigned-URL
  contract in place for when S3 is added.
- **Polling, not WebSockets.** The conversation thread polls every 15 seconds,
  which the spec names as the fallback path.
- **No moderation admin tool.** Reports and the auto-hide rule are implemented;
  the queue itself is a separate internal surface.
- **No seed data.** Clerk owns passwords, so the old shared-password demo
  accounts cannot exist without being created in Clerk first.
- **Service role, not row level security.** The app authorises every request in
  the API layer and connects with the service role key. RLS is switched on with
  no policies, so the anon key cannot reach the tables directly.

## Accessibility

Built to WCAG 2.1 AA: keyboard reachable throughout with visible focus rings,
modals that trap focus and close on Escape, form inputs with real labels rather
than placeholders, errors announced through `aria-live`, listing images that
carry the listing title as alt text, and `prefers-reduced-motion` respected. The
yellow primary button uses dark ink for 11.2:1 contrast; white on yellow is
never used. Layouts are usable from 320px upward.

Contrast is measured, not assumed. Every text node on every route was checked
against its computed background, which surfaced several failures in the brand
palette itself: brand yellow reaches only 1.8:1 on white and can never carry
text, and the trade purple falls to 3.9:1 on its own tint. The fill colours are
unchanged, and `--brand-yellow-text`, `--purple-text` and `--red-text` carry the
same hues where they have to be legible. Avatar tints choose ink or white
initials by luminance so every one clears 4.5:1.
