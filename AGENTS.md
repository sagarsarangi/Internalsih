# AGENTS.md

This is the entry point. Read this file first, every session, before
touching any code.

## What this project is

**Smart Helmet (PS-06 | Low-Cost IoT Smart Helmet for Accident Detection & Rider Safety)**:
A Next.js companion platform and emergency dispatch system paired with an IoT smart helmet embedded with motion sensors (accelerometer/gyroscope) and GPS+GSM module. Two halves:

1. **Public**: a minimal landing page showcasing project background, hardware core loop, and public API returning historical crash telemetry.
2. **Admin/Operator Console**: an authenticated dashboard with an interactive map. Operators can monitor live crashes or simulate collision impact — triggering a 10-second false-alarm countdown window, which either gets cancelled ("False Alarm") or confirmed: reverse-geocoded, stored to Supabase, and dispatched via emergency SMS (TextBee [Default]), Telegram Bot, or Email SMTP with live real-time map synchronization.

**Everything is Next.js.** There is no separate Express/Node backend
and no separate React SPA, even though the original spec's diagrams
draw them as separate boxes — those map onto Next.js Route Handlers
and Next.js pages respectively. See `ARCHITECTURE.md` §1 for the exact
mapping.

## Reading order

1. **This file** — orientation, how the docs relate, how to work here.
2. **`ARCHITECTURE.md`** — the full technical spec: stack, folder
   structure, data model, auth flow, request/response flows for both
   phases, environment variables, and how to connect Supabase. Read
   this before writing or changing any code.
3. **`DESIGN.md`** *(already provided separately, not part of this
   set)* — the visual system: colors, type, spacing, layout, map
   styling. Read this before writing or changing any UI. If it's
   missing from the repo when you start, stop and ask for it rather
   than inventing a design system.

Think of it as: AGENTS.md tells you *where to look*, ARCHITECTURE.md
tells you *how to build it*, and DESIGN.md tells you *how it should look*.

## How to work in this repo

1. Before implementing, read the relevant section of `ARCHITECTURE.md`
   for that concern (auth, the map, the API route, etc.), and the
   relevant section of `DESIGN.md` if it touches UI.
2. Implement the required feature or change according to specifications.
3. If you had to deviate from what `ARCHITECTURE.md` or `DESIGN.md`
   describes, **update those files too, in the same turn**. They must
   stay accurate — an agent reading them next session shouldn't have
   to reverse-engineer the code to find out the docs are stale.

## Ground rules

- No signup flow, ever. One admin, credentials from env vars only, no
  in-app password-change UI (see `ARCHITECTURE.md` §4 for why).
- No password or secret ever stored in the database.
- The Supabase service-role key is server-only — never let it reach
  client-side code or the browser bundle.
- False alarms (cancelled tags) are never persisted to the database.
- Incidents are tracked and persisted only after verified alert
  dispatch (SMS via TextBee [Default], Telegram Bot, or Email SMTP);
  alert dispatch failures abort database persistence.
- No new dependencies without a reason that can't be met by what's
  already specified in `ARCHITECTURE.md` — keep this project small.
- Follow `DESIGN.md` for anything visual. If a rule in there seems
  wrong for something you're building, say so and propose an edit —
  don't just quietly ignore it.
- Keep `ARCHITECTURE.md` in sync with the actual code at all times.
  Stale docs are worse than no docs.

## Setup (for whoever runs this locally)

```bash
npm install
cp .env.example .env.local   # then fill in real values
npm run dev
```

Minimum required to run for real:

- A Supabase project — create the `incidents` table and RLS policy per
  `ARCHITECTURE.md` §3, enable Realtime replication, and copy the URL
  + anon key + service role key into `.env.local`. Full steps in
  `ARCHITECTURE.md` §7.
- An `ADMIN_USERNAME` / `ADMIN_PASSWORD` of your choosing, and a
  `SESSION_SECRET` (e.g. `openssl rand -base64 32`).
- Emergency dispatch channel credentials in `.env.local`:
  - SMS Gateway (`TEXTBEE_API_KEY`, optional `TEXTBEE_DEVICE_ID`)
  - Telegram Bot (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_ALERT_CHAT_ID`)
  - Email SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` for Gmail or custom SMTP)

**To change the admin password later:** edit `ADMIN_PASSWORD` in
`.env.local` (or your host's environment variable settings) and
restart the app. There is no in-app UI for this, on purpose.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
