# ARCHITECTURE.md — Smart Helmet System Architecture & Workflow

**PS-06 | Low-Cost IoT Smart Helmet for Accident Detection & Rider Safety**

This is the complete technical reference for how the Smart Helmet platform is
built and structured. It is a living specification. Pair it with
`DESIGN.md` (visual design system).

## 1. Stack

Everything runs inside **one Next.js (App Router) application**. There
is no separate Express/Node backend and no separate React SPA.

- "React Frontend" → Next.js pages, client components, and modals
  (`app/**/page.tsx`, `components/**`)
- "Backend Services" → Next.js Route Handlers
  (`app/api/**/route.ts`)

| Concern | Technology |
|---|---|
| Framework & Runtime | Next.js (App Router, v16+), React 19, TypeScript |
| Language | TypeScript throughout — strict mode, no `.js`/`.jsx` files |
| Styling | Tailwind CSS v4, PostCSS, `@tailwindcss/postcss`, Lucide Icons |
| Database | Supabase (Postgres) |
| Realtime push | Supabase Realtime (Postgres change feed over websockets) |
| Map rendering | MapLibre GL JS (keyless vector/raster tiles with 4 switchable providers & bounding box fit) |
| Schema/validation | Zod — schemas for auth, incident records, simulation requests, and phone numbers |
| Client state | Zustand — one store per concern (`incident-store.ts`, `pending-tag-store.ts`) |
| Auth & Cryptography | Single hardcoded admin credential pair (env vars) + signed HS256 JWT cookie via `jose` |
| Route protection | Next.js Edge Middleware (`middleware.ts`) redirecting unauthorized visitors to `/?login=true` |
| Geocoding | LocationIQ API (with 5-second `AbortController` timeout guard, latency telemetry, and coordinate fallback) |
| Emergency Telegram | Telegram Bot API (`t.me/IntSih_bot`, HTML collision alert with Google Maps coordinates) |
| Emergency Email | SMTP / Nodemailer (high-contrast emergency HTML collision report with direct navigation button) |
| Emergency SMS | TextBee API / `@textbee/sdk` (compact E.164 emergency SMS dispatch with `+91` 10-digit validation) |

## 2. Project Structure

```
/app
  /actions
    /auth.ts                       → Server Action: securely fetch default credentials from env vars
  /page.tsx                        → Landing page (public, hosts system showcase & <LoginManager />)
  /dashboard/layout.tsx            → Server-side authentication guard for the dashboard
  /dashboard/page.tsx              → Admin dashboard + live map (protected)
  /api/login/route.ts              → POST: verify credentials, set session cookie (HS256 JWT)
  /api/logout/route.ts             → POST: clear session cookie
  /api/incidents/route.ts          → GET: historical incidents (public), DELETE: remove an incident (protected)
  /api/simulate-accident/route.ts  → POST: single-channel dispatch & confirm incident (protected)
  /api/telegram/sync-chat/route.ts → GET: fetch Telegram bot info & check configured Chat ID
  /globals.css                     → Design tokens and MapLibre overrides, per DESIGN.md
  /layout.tsx                      → Root layout with Geist Sans and Geist Mono typography
/components
  /ui
    /badge.tsx                     → Reusable status and channel pill badge
    /button.tsx                    → Reusable styled button with variants
  /AccidentMap.tsx                 → MapLibre map: 4 tile styles, bounds fit, historical render + live tagging flow + incidents list drawer
  /emergency-dispatch-modal.tsx    → Single-channel dispatch console modal with error retry & tab switching
  /login-manager.tsx               → URL search param listener (?login=true) wrapped in React Suspense
  /login-modal.tsx                 → Admin login dialog modal with keyboard and backdrop dismiss
/lib
  /email.ts                        → Nodemailer SMTP emergency alert email dispatch
  /geocode.ts                      → LocationIQ reverse geocoding with timeout and latency logging
  /session.ts                      → HS256 JWT session sign/verify using jose (12h TTL)
  /sms.ts                          → TextBee SDK emergency SMS alert dispatch
  /supabase-browser.ts             → Anon-key Supabase client (browser, used for Realtime)
  /supabase-server.ts              → Service-role Supabase client (server-only, bypasses RLS)
  /telegram.ts                     → Telegram Bot API message dispatch and bot metadata
  /utils.ts                        → Class name combination helper (clsx + tailwind-merge)
/schemas
  /auth.ts                         → Zod: LoginPayload, SessionPayload
  /incident.ts                     → Zod: Incident, AlertChannelOptions, SimulateAccidentPayload, IncidentList
/store
  /incident-store.ts               → Zustand: list of incidents on the map (deduped by ID)
  /pending-tag-store.ts            → Zustand: in-flight tag during confirmation window & concurrency guard
/supabase
  /schema.sql                      → Postgres table schema, RLS policies, index, and realtime publication
/middleware.ts                     → Next.js Edge route protection
/.env.example                      → Documented list of required env vars
```

## 3. Data Model

Single table: `incidents` in Supabase Postgres.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid`, primary key | default `uuid_generate_v4()` |
| `lat` | `double precision` | not null |
| `lng` | `double precision` | not null |
| `address` | `text`, nullable | reverse geocoded street address or coordinate fallback |
| `victim_name` | `text`, nullable | driver, victim, or vehicle identifier |
| `telegram` | `text`, nullable | sparse: Telegram Bot target Chat ID |
| `email` | `text`, nullable | sparse: recipient emergency email address |
| `sms` | `text`, nullable | sparse: recipient emergency phone number (E.164 `+91...`) |
| `occurred_at` | `timestamptz`, not null | client-captured collision timestamp |
| `status` | `text`, not null, default `'confirmed'` | status of the incident (`'confirmed'`) |
| `created_at` | `timestamptz`, not null, default `now()` | DB insertion timestamp |

```sql
CREATE TABLE IF NOT EXISTS public.incidents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  address text,
  victim_name text,
  telegram text,
  email text,
  sms text,
  occurred_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status = 'confirmed'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_incidents_occurred_at_desc ON public.incidents (occurred_at DESC);
```

**Row Level Security**: RLS enabled with public read-only policy for `anon` and `authenticated` roles (`USING (true)`). Mutations strictly execute through the server-side route handler via `lib/supabase-server.ts` using the **service-role** key (bypassing RLS).

## 4. Auth & Middleware

- Single admin credentials configured via `ADMIN_USERNAME` / `ADMIN_PASSWORD` environment variables.
- **Edge Route Protection (`middleware.ts`)**:
  - Guards `/dashboard/**`, `POST /api/simulate-accident`, `DELETE /api/incidents`, and `GET /api/telegram/sync-chat`.
  - If unauthorized on a page route, redirects to `/?login=true`.
  - If unauthorized on an API route, returns HTTP 401 JSON.
  - If already authorized and visiting `/` or `/?login=true`, allows fast direct access to `/dashboard`.
- **Modal Login Experience (`components/login-modal.tsx`, `components/login-manager.tsx`, `app/actions/auth.ts`)**:
  - `LoginManager` monitors the URL search params on the landing page inside a `<Suspense>` boundary.
  - When `?login=true` is triggered (or "Sign In" button is clicked), `LoginModal` mounts over the landing page.
  - The modal dynamically calls the `getDemoCredentials()` Server Action to fetch and pre-fill the username and password fields directly from environment variables.
  - Form submission sends credentials to `POST /api/login`.
  - On success, `POST /api/login` issues an `httpOnly`, `sameSite=lax`, `secure` (in production) signed JWT cookie (`SESSION_SECRET`, HS256, 12h expiration) named `admin_session`, and the browser triggers a hard navigation (`window.location.href`) directly to `/dashboard` to ensure clean middleware state.
- **Sign Out**: `POST /api/logout` clears the `admin_session` cookie and redirects the operator to `/`.

## 5. Request & Dispatch Flows

### Initial Load & Map Visualization
1. Landing page or dashboard map initializes `AccidentMap.tsx`.
2. Fetches `GET /api/incidents` to load historical collisions.
3. Validated against `IncidentListSchema` and loaded into `useIncidentStore`.
4. Markers are rendered on the WebGL map canvas with interactive popups (coordinates, timestamp, geocoded address, victim ID, and delivery badges).
5. Operators can switch between 4 tile providers (OSM Standard, CARTO Voyager, CARTO Positron, CARTO Dark Tactical).
6. **Incident Management**: The "LIVE" incidents badge toggles a drawer side-panel listing all active incidents. Admins can view details, locate them on the map, or permanently delete false-positives (removing them from the DB and syncing deletion across all clients via Realtime).

### Accident Tagging & Emergency Dispatch Workflow (Admin Only)
1. **Tag Placement**: Operator enters latitude and longitude manually into the form overlay and clicks "Accident" in `/dashboard`. A pulsating beacon is dropped at those coordinates, and a 10-second animated countdown bar mounts.
2. **Branch A (Cancel / False Alarm)**:
   - Operator clicks "False Alarm".
   - `usePendingTagStore.clearPendingTag()` clears state in memory.
   - **Zero network calls are made and nothing is saved to the database**.
3. **Branch B (Alert Channel Selection & Confirmation)**:
   - Operator clicks "Configure & Send" or the 10-second countdown reaches zero.
   - The monochrome **Emergency Dispatch Modal** (`EmergencyDispatchModal`) opens.
   - Operator specifies an optional driver/victim identifier and selects **one** emergency channel (**SMS is the default**):
     - **SMS (TextBee) [Default]**: Fixed `+91` (India) country code, 10-digit mobile number Zod validation (`PhoneNumber10DigitSchema`), formatted to E.164 (`+91<10-digits>`), and dispatched via TextBee gateway.
     - **Telegram Bot**: Formatted HTML collision alert dispatched to `TELEGRAM_ALERT_CHAT_ID`.
     - **Email (SMTP)**: High-contrast HTML collision report dispatched via Nodemailer.
4. **Dispatch Execution & Error Retry Flow (`POST /api/simulate-accident`)**:
   - Reverse-geocodes coordinates via LocationIQ (with 5s timeout guard, telemetry logging, and coordinate fallback).
   - Dispatches emergency alert through the selected channel.
   - **Non-blocking Error Fallback**: If the selected channel fails (e.g., gateway offline, invalid number, or bad credentials), the server returns HTTP 422 with the failure explanation. The modal **remains open**, presents the error, and allows the operator to switch channels and retry immediately.
   - **Strict Verified Persistence Gate**: Database insertion occurs **only after** verified successful delivery. If dispatch fails, database write is aborted.
   - Returns HTTP 201 with the persisted row and delivery receipts.
5. **Realtime Broadcast & Store Sync**:
   - The dispatch modal closes, the local client adds the incident to `useIncidentStore`, and shows a delivery toast.
   - Supabase Realtime WebSocket subscription (`postgres_changes` on `public:incidents`) automatically broadcasts the newly inserted row to all active client sessions in real time.

## 6. Environment Variables

Documented in `.env.example`:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `SESSION_SECRET`
- `LOCATIONIQ_API_KEY`, `LOCATIONIQ_REGION`
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_ALERT_CHAT_ID`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- `TEXTBEE_API_KEY`, `TEXTBEE_DEVICE_ID`

## 7. Non-negotiables

- No signup flow; credentials reside in environment variables only.
- Supabase service-role key is strictly server-side and never reaches the browser bundle.
- False alarms (cancelled tags) are never persisted to the database.
- Incident persistence strictly requires verified emergency alert dispatch.
