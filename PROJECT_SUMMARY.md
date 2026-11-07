# GRIDWISE — Project Architecture & Implementation Summary

## 1. Project Overview
**GRIDWISE** is a smart home electricity monitoring and energy management platform tailored for Indian residential households. It estimates electricity use and costs using sample Kerala tariff settings. The app also includes sample solar readings, appliance schedules and community figures.

**Household:** Shamil Residence, Malappuram, Kerala

---

## 2. Tech Stack
- **Framework**: Next.js 16 (Turbopack, App Router)
- **Language**: TypeScript 5 (Strict Mode)
- **Database**: Supabase (PostgreSQL + Realtime)
- **Styling**: Tailwind CSS v4 with `@tailwindcss/turbopack`
- **Icons**: Lucide React
- **Charts**: Recharts (Area, Bar, Donut)
- **State**: React Context (`AppProvider`) + Supabase Realtime sync
- **Animations**: Framer Motion
- **Toasts**: Sonner
- **Package Manager**: pnpm

---

## 3. What Was Built

### A. Core Infrastructure
| File | Description |
|---|---|
| `src/types/index.ts` | Full TypeScript type definitions |
| `src/constants/index.ts` | KSEB tariff slabs, peak hours, appliance presets, nav items |
| `src/lib/calculations/energy.ts` | Energy math engine — kWh, telescopic billing, 24h load curves, simulation |
| `src/lib/utils.ts` | `formatCurrency`, `formatKwh`, `formatPower`, `cn` |
| `src/lib/supabase.ts` | Supabase client (graceful fallback if env missing) |
| `src/lib/db.ts` | All DB helpers — households, appliances, events, sessions |
| `src/data/seed.ts` | Demo data — Shamil Residence + 13 appliances |

### B. Database (Supabase)
Schema file: `supabase-schema.sql`

| Table | Purpose |
|---|---|
| `households` | Household metadata, tariff rate, connected load |
| `appliances` | Appliance inventory with schedule and status |
| `appliance_events` | Raw ON/OFF events from sensor or manual toggle |
| `appliance_sessions` | Derived ON→OFF pairs with exact duration and kWh |

Realtime subscriptions enabled on `appliances` and `appliance_sessions`.

### C. API Routes
| Route | Method | Purpose |
|---|---|---|
| `/api/sensor` | POST | Receives `{ appliance_id, event_type, source }` — logs event, opens/closes session, updates appliance status |
| `/api/sensor` | GET | Returns current status + open session for an appliance |
| `/api/sessions` | GET | Returns recent sessions aggregated by appliance |

### D. UI Components
| Component | Description |
|---|---|
| `AppShell` | Persistent shell — collapsible sidebar + animated TopNav |
| `Sidebar` | Desktop collapsible + mobile drawer |
| `TopNav` | Animates left offset in sync with sidebar expand/collapse |
| `AppProvider` | Central state — loads from Supabase on mount, realtime sync, all CRUD ops fire API |
| `SessionsPanel` | Live session tracker — shows ON/OFF events with duration and Wh per session |
| `EnergyFlowDiagram` | House image overlay — Grid, Solar, Home, Battery, EV values live |
| `ThemeProvider` | Dark/Light mode with localStorage persistence |

### E. Pages (All Implemented)
| Route | Status | Features |
|---|---|---|
| `/dashboard` | ✅ | Live power meter, stat cards, energy flow diagram, 24h chart, donut chart, appliance toggles, session tracker, recommendations |
| `/appliances` | ✅ | Full CRUD — add/edit/delete, category filter, search, preset autofill, DB sync |
| `/analytics` | ✅ | 24h/7d/6m charts, KSEB slab progression, peak vs off-peak audit, top consumers |
| `/scheduler` | ✅ | 24h visual matrix, 1-click AI smart shift, per-appliance shift buttons |
| `/simulator` | ✅ | Community peak demand simulator, 4 presets, 6 sliders, before/after chart |
| `/solar` | ✅ | Solar telemetry, battery SoC, 3-way power routing, CO2 abatement, specs |
| `/reports` | ✅ | Full energy audit — telescopic slab table, appliance breakdown, CSV export, print/PDF |
| `/community` | ✅ | Feeder load gauge, peak-shave challenge, neighbourhood leaderboard |
| `/settings` | ✅ | Household config, solar config, theme toggle, factory reset |

---

## 4. Sensor Integration (Simulated Hardware)
When configured, an appliance toggle in the UI sends `POST /api/sensor` which:
1. Logs the raw ON/OFF event to `appliance_events`
2. Opens a new session row in `appliance_sessions` (on ON)
3. Closes the session with exact `duration_minutes` and `energy_kwh` (on OFF)
4. Updates appliance `status` in Supabase
5. Realtime subscription pushes the update back to all connected clients

For real hardware (ESP32 etc.), just POST to `/api/sensor` with `{ appliance_id, event_type: "on"|"off", source: "sensor" }`.

---

## 5. Data limits and demo behavior

Several screens use generated or sample values rather than readings from real equipment. Solar generation is calculated from panel capacity, hourly household use is generated from appliance settings, and the community page shows fixed example households and transformer figures. The scheduling suggestion is a fixed rule that moves flexible appliances to daytime; it does not use an AI model or control appliances on its own. Treat bill and savings figures as estimates; they do not replace a KSEB bill.

## 6. Current Status
- ✅ Full build passing (zero errors, zero warnings)
- ✅ All 9 routes implemented and functional
- ✅ Supabase DB connected — schema deployed, realtime active
- ✅ Live session tracking working
- ✅ Energy flow diagram with house image on dashboard
- ✅ Sidebar expand/collapse synced with TopNav
- ✅ Name updated to Shamil Residence, Malappuram, Kerala
- ✅ Demo mode badge removed
- ✅ pnpm configured

---

## 7. How to Run
```bash
pnpm install
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000)

### Environment Variables (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=https://gcsbmhimcclcooexibvf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Deploy to Vercel
Add the same env vars in Vercel Dashboard → Settings → Environment Variables.
