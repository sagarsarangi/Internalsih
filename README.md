# Smart Helmet

**PS-06 | Low-Cost IoT Smart Helmet for Accident Detection & Rider Safety**  
*Category: Hardware &middot; Theme: Smart Vehicles*

![Status](https://img.shields.io/badge/Status-Production--Ready-success?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![MapLibre GL](https://img.shields.io/badge/MapLibre_GL-396CB1?style=for-the-badge&logo=maplibre&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![TextBee](https://img.shields.io/badge/TextBee_SMS-FF6B6B?style=for-the-badge&logo=twilio&logoColor=white)
![Telegram](https://img.shields.io/badge/Telegram_Bot-26A5E4?style=for-the-badge&logo=telegram&logoColor=white)
![Nodemailer](https://img.shields.io/badge/Nodemailer_SMTP-0078D4?style=for-the-badge&logo=gmail&logoColor=white)
![LocationIQ](https://img.shields.io/badge/LocationIQ_Geocoding-008080?style=for-the-badge)
![Zustand](https://img.shields.io/badge/Zustand-443E38?style=for-the-badge)
![Zod](https://img.shields.io/badge/Zod-3068B7?style=for-the-badge&logo=zod&logoColor=white)

---

## Background & Problem Statement

Two-wheeler fatalities are high in India, often worsened by delayed emergency response since no one is alerted immediately after a crash, especially on highways or remote roads.

**Smart Helmet** solves this by embedding a motion sensor (accelerometer/gyroscope) to detect crash-level impact, paired with a GPS+GSM/cellular module that automatically sends an emergency SMS alert with live location coordinates to a pre-set emergency contact when a crash is detected.

### Core Objectives & MVP Scope
- **Impact Detection Core Loop**: Microcontroller reads motion sensor telemetry and detects sudden crash-level spikes (g-force threshold).
- **Automated Emergency SMS Alert**: Transmits cellular SMS alerts with exact GPS coordinates and Google Maps navigation links.
- **Manual False-Alarm Cancellation**: A 10-second cancel button window allows riders or operators to dismiss false triggers immediately before alert dispatch and database persistence.
- **Real-Time Telemetry & Dispatch Console**: Next.js companion platform rendering live WebGL maps (MapLibre GL) synchronized in real-time across terminals via Supabase Realtime.

---

## Table of Contents

- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Operational Workflows & System Diagrams](#operational-workflows--system-diagrams)
  - [1. Manual Coordinate Input & 10s False Alarm Guard](#1-manual-coordinate-input--10s-false-alarm-guard)
  - [2. Multi-Channel Emergency Dispatch & Atomic Verification Gate](#2-multi-channel-emergency-dispatch--atomic-verification-gate)
  - [3. Real-Time Multi-Terminal WebSocket Synchronization](#3-real-time-multi-terminal-websocket-synchronization)
- [Database Schema & Security Architecture](#database-schema--security-architecture)
- [Technology Stack](#technology-stack)

---

## Key Features

- **Interactive WebGL Vector Map (MapLibre GL)**: High-performance map canvas featuring 4 switchable tile providers (*OpenStreetMap Standard*, *CARTO Voyager*, *CARTO Positron*, and *CARTO Dark Tactical*), dynamic camera bounds fitting, and interactive incident popups.
- **Active Incident Management Drawer**: Integrated side-panel to view all live incidents in a clean list format. Admins can quickly locate accidents on the map or permanently delete false-positives (which synchronizes deletion across all active terminals via WebSocket).
- **Manual Coordinate Input & Sensor Simulation**: Instant accident simulation via manual latitude/longitude input with an interactive pulsing beacon and a 10-second visual countdown window.
- **Zero-Pollution False Alarm Guard**: Client-side cancellation mechanism that aborts accidental triggers in memory before any network request or database write occurs.
- **Multi-Channel Emergency Alert Dispatching**:
  - **SMS Gateway (TextBee API) [Default]**: Sends concise, high-priority SMS alerts with fixed `+91` (India) country codes, 10-digit mobile number validation, and direct Google Maps navigation links.
  - **Telegram Bot API**: Delivers formatted HTML collision notices with coordinates, street address, timestamp, and victim identifiers to configured field channels.
  - **Emergency Email (SMTP / Nodemailer)**: Generates high-contrast, dark-mode incident reports with one-click responder routing.
- **Strict Verification Persistence Protocol**: Incidents are persisted into PostgreSQL **only after** verified successful alert delivery. If all alert channels fail, the database write is rejected with an inline retry prompt.
- **Sub-50ms Real-Time Push (Supabase Realtime)**: Real-time PostgreSQL change-feed replication pushing new collisions across all active operator terminals without polling.
- **Edge Route Protection & Ephemeral Sessions**: Cookie-based signed HS256 JWT sessions protected by Next.js Edge Middleware with zero stored database passwords.
- **Fast Reverse Geocoding with Telemetry**: LocationIQ reverse geocoding with a 5-second `AbortController` timeout guard, sub-50ms resolution, and graceful raw coordinate fallback.

---

## System Architecture

Smart Helmet operates as a unified Next.js App Router monolith combining React 19 client components, Edge route middleware, server-side Route Handlers, and Supabase PostgreSQL.

```mermaid
graph TD
    subgraph Client Layer ["Client Layer (React 19 & Zustand)"]
        A["Public Landing Page (app/page.tsx)"]
        B["Admin Console (app/dashboard/page.tsx)"]
        C["MapLibre GL Canvas (components/AccidentMap.tsx)"]
        D["Dispatch Modal (components/emergency-dispatch-modal.tsx)"]
        E[("Zustand Incident Store")]
        F[("Zustand Pending Tag Store")]
        
        B --> C
        C <--> F
        C <--> E
        C --> D
    end

    subgraph Security Layer ["Edge Security & Routing"]
        M{"Edge Middleware (middleware.ts)"}
        AUTH["HS256 JWT Cookie (jose / lib/session.ts)"]
        M -->|"Guard Session"| B
        M -->|"Protect Mutation"| API_SIM
    end

    subgraph Server Layer ["Next.js Server Layer"]
        API_AUTH["POST /api/login & /api/logout"]
        API_INC["GET /api/incidents (Public)"]
        API_SIM["POST /api/simulate-accident (Protected)"]
        API_TG["GET /api/telegram/sync-chat"]
    end

    subgraph External Gateways ["External Gateways"]
        GEO["LocationIQ API (Reverse Geocoding)"]
        SMS["TextBee Gateway (+91 SMS Alert)"]
        TG["Telegram Bot API (@IntSih_bot)"]
        SMTP["SMTP Mail Server (Nodemailer)"]
    end

    subgraph Persistence Layer ["Supabase Cloud"]
        DB[("PostgreSQL: public.incidents (RLS Protected)")]
        RT["Supabase Realtime Engine (WebSocket)"]
    end

    D -->|"Simulate Collision Payload"| API_SIM
    API_AUTH <--> AUTH
    API_SIM --> GEO
    API_SIM --> SMS
    API_SIM --> TG
    API_SIM --> SMTP
    
    API_SIM -->|"Service-Role Insert on Verified Delivery"| DB
    API_INC -->|"Public Read-Only Query"| DB
    DB -->|"Postgres WAL Trigger"| RT
    RT -.->|"WebSocket INSERT Push"| E
```

---

## Operational Workflows & System Diagrams

### 1. Manual Coordinate Input & 10s False Alarm Guard

When an operator enters latitude and longitude in the form overlay, a provisional accident tag is placed in memory. The system starts a 10-second countdown allowing the operator to dismiss accidental triggers with zero network overhead.

```mermaid
sequenceDiagram
    autonumber
    actor Operator as Admin Operator
    participant Map as MapLibre GL Canvas
    participant Store as Zustand Pending Tag Store
    participant Modal as Emergency Dispatch Modal
    participant API as Next.js Route Handler

    Operator->>Form: Enters lat, lng and clicks "Accident"
    Map->>Store: setPendingTag({ lat, lng, taggedAt: Date.now() })
    Map->>Map: Mount pulsating beacon & start 10s countdown bar

    alt Scenario A: False Alarm (Cancelled)
        Operator->>Map: Clicks "False Alarm (Cancel)"
        Map->>Store: clearPendingTag()
        Map->>Map: Remove beacon from canvas
        Note over Map,API: 0 Network Calls Made - Zero Database Pollution
    else Scenario B: Confirm or Timer Expiry
        Operator->>Map: Clicks "Configure & Send" (or 10s timer reaches 0)
        Map->>Modal: Mount Emergency Dispatch Console Modal
        Modal->>Modal: Select alert channel (SMS [Default] / Telegram / Email)
        Operator->>Modal: Enters victim name & contact details -> Clicks "Dispatch & Record"
        Modal->>API: POST /api/simulate-accident { lat, lng, name, channels }
    end
```

---

### 2. Multi-Channel Emergency Dispatch & Atomic Verification Gate

The backend processes the dispatch request, performs reverse geocoding, attempts alert delivery through the requested channel, and gates database persistence on confirmed delivery.

```mermaid
flowchart TD
    A["POST /api/simulate-accident"] --> B["Zod Schema Validation (SimulateAccidentPayloadSchema)"]
    B -->|"Validation Failed"| ERR1["Return HTTP 400 Bad Request"]
    
    B -->|"Payload Valid"| C["Reverse Geocode via LocationIQ API (5s Timeout Guard)"]
    C -->|"Success"| D["Resolve Street Address"]
    C -->|"Timeout / Fail"| E["Fallback to Raw Coordinates (lat, lng)"]
    
    D & E --> F{"Selected Emergency Channel"}
    
    F -->|"SMS via TextBee (Default)"| G["Format E.164 (+91XXXXXXXXXX) -> Dispatch via TextBee SDK"]
    F -->|"Telegram Bot"| H["Generate HTML Payload -> Telegram Bot API (sendMessage)"]
    F -->|"Email SMTP"| I["Generate Dark HTML Report -> Nodemailer SMTP Transport"]
    
    G & H & I --> J{"Delivery Verification Gate"}
    
    J -->|"All Dispatches Failed"| K["HTTP 422 Unprocessable Entity<br/>Modal Remains Open for Retry<br/>Database Persistence Aborted"]
    
    J -->|"At Least One Succeeded"| L["Supabase Service-Role Client<br/>INSERT INTO public.incidents"]
    
    L -->|"DB Insert Failed"| M["Return HTTP 500 Internal Server Error"]
    L -->|"DB Insert Successful"| N["Return HTTP 201 Created<br/>(Incident Record + Dispatch Receipts)"]
    
    N --> O["Modal Closes + Local Zustand Store Updated + Notification Toast Displayed"]
```

---

### 3. Real-Time Multi-Terminal WebSocket Synchronization

Once an incident is inserted into PostgreSQL, Supabase Realtime broadcasts the row across all connected operator sessions instantly.

```mermaid
flowchart LR
    subgraph Server Side
        A["Verified DB Insert"] --> B[("PostgreSQL: public.incidents")]
        B --> C["Postgres Logical Replication"]
        C --> D["Supabase Realtime Publication"]
    end

    subgraph Network
        D -->|"WebSocket JSON Frame"| E["Subscribed Client Sessions"]
    end

    subgraph Client Consoles
        E --> F["Terminal 1 (HQ Dashboard)"]
        E --> G["Terminal 2 (Field Tablet)"]
        E --> H["Terminal 3 (Dispatch Center)"]
        
        F --> I["useIncidentStore.addIncident()"]
        G --> I
        H --> I
        
        I --> J["UUID Deduplication Check"]
        J --> K["MapLibre Injects Custom Marker & Popup"]
    end
```

---

## Database Schema & Security Architecture

### PostgreSQL Table Definition (`public.incidents`)

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  address TEXT,
  victim_name TEXT,
  telegram TEXT,
  email TEXT,
  sms TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status = 'confirmed'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for descending timestamp queries (newest collisions first)
CREATE INDEX IF NOT EXISTS idx_incidents_occurred_at_desc 
ON public.incidents (occurred_at DESC);
```

### Security & Row Level Security (RLS) Policies

| Role / Context | Permissions | Implementation Mechanism |
|---|---|---|
| **Public (`anon`)** | `SELECT` Only | Protected by Supabase RLS policy `USING (true)` |
| **Authenticated Users** | `SELECT` Only | Read-only access to historical collisions |
| **Admin Route Handlers** | `INSERT` / `MUTATION` | Executed exclusively server-side via `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS) |
| **Admin Operator Session** | Full Access | Signed HS256 JWT cookie (`admin_session`), verified at Next.js Edge |

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | React Server Components, Route Handlers, Edge Middleware |
| **UI Library** | React 19 & TypeScript | Strict type safety, functional component architecture |
| **Styling** | Tailwind CSS v4 | Engineering-grade monochrome dark mode per `DESIGN.md` |
| **Map Rendering** | MapLibre GL JS | WebGL vector map rendering with 4 interchangeable tile sets |
| **Database** | Supabase (PostgreSQL) | Structured persistence, descending timestamp indexing |
| **Realtime Sync** | Supabase Realtime | WebSocket changefeed for live multi-session synchronization |
| **SMS Gateway** | TextBee API / `@textbee/sdk` | Cellular SMS collision notifications with `+91` formatting |
| **Telegram Bot** | Telegram Bot API | Formatted emergency collision dispatches with Google Maps link |
| **Email Gateway** | Nodemailer / SMTP | Responsive HTML emergency collision reports |
| **Geocoding** | LocationIQ API | Latency-monitored reverse geocoding with timeout guard |
| **State Management**| Zustand | Dedicated stores for confirmed incidents and pending tags |
| **Schema Validation**| Zod | Runtime payload validation for auth, dispatches, and phone numbers |
| **Session Security**| `jose` (JWT) | HS256 tamper-proof signed session cookies |
