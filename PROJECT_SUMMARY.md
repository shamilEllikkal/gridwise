# GRIDWISE — Project Architecture & Implementation Summary

## 1. Project Overview
**GRIDWISE** is a modern smart electricity monitoring and energy management platform tailored for Indian residential households (modeled with realistic Kerala KSEB telescopic billing, peak solar hours, and demand response).

---

## 2. Tech Stack
- **Framework**: Next.js 16 (Turbopack, App Router)
- **Language**: TypeScript 5 (Strict Mode)
- **Styling**: Tailwind CSS v4 (Inline CSS variables, custom dark/light theme)
- **Icons**: Lucide React
- **Charts & Data Viz**: Recharts (Responsive Area, Bar, Donut charts)
- **State Management**: React Context (`AppProvider`) + LocalStorage persistence
- **Animations**: Framer Motion
- **Toasts**: Sonner

---

## 3. What Was Built & Implemented

### A. Core Architecture & Infrastructure
1. **[src/types/index.ts](file:///c:/Users/hp/OneDrive/Desktop/My-Projects/NEXT/gridwise/src/types/index.ts)**:
   - Complete type definitions for `Appliance`, `Household`, `EnergyReading`, `SolarProfile`, `Community`, `SimulationConfig`, `SimulationResult`, `Schedule`, `DashboardStats`, etc.
2. **[src/constants/index.ts](file:///c:/Users/hp/OneDrive/Desktop/My-Projects/NEXT/gridwise/src/constants/index.ts)**:
   - Kerala KSEB Telescopic Tariff Slabs (Slab 1 to Slab 6 with tiered rates and fixed charges).
   - Peak hours window (18:00 - 22:00), Solar generation hours (10:00 - 16:00).
   - Appliance presets & defaults (ACs, pumps, fans, induction, refrigerators, EVs).
   - Community simulation presets (Normal, Evening Peak, Coordinated Community, Solar-Assisted).
3. **[src/lib/calculations/energy.ts](file:///c:/Users/hp/OneDrive/Desktop/My-Projects/NEXT/gridwise/src/lib/calculations/energy.ts)**:
   - Full mathematical calculation engine: daily kWh, monthly kWh, telescopic slab bill computation, CO2 abatement, 24h deterministic load curve generation, and community-scale peak demand simulation.
4. **[src/lib/utils.ts](file:///c:/Users/hp/OneDrive/Desktop/My-Projects/NEXT/gridwise/src/lib/utils.ts)**:
   - Formatting helpers: `formatCurrency` (INR ₹), `formatKwh`, `formatPower` (W / kW), and `cn` for Tailwind class merging.
5. **[src/components/providers/AppProvider.tsx](file:///c:/Users/hp/OneDrive/Desktop/My-Projects/NEXT/gridwise/src/components/providers/AppProvider.tsx)**:
   - Central application state: reactive appliances array, household metadata, rooftop solar profile, live derived statistics (`stats`), and automatic `localStorage` synchronization.
6. **[src/components/providers/ThemeProvider.tsx](file:///c:/Users/hp/OneDrive/Desktop/My-Projects/NEXT/gridwise/src/components/providers/ThemeProvider.tsx)**:
   - Dark/Light mode provider with CSS class toggling and storage persistence.
7. **[src/components/layout/AppShell.tsx](file:///c:/Users/hp/OneDrive/Desktop/My-Projects/NEXT/gridwise/src/components/layout/AppShell.tsx)**:
   - Persistent shell with collapsible desktop sidebar, responsive mobile drawer, and top navigation bar.

---

### B. Complete Route Implementations

| Route | Page File | Features & Description |
|---|---|---|
| **/** | `src/app/page.tsx` | Auto-redirects to `/dashboard`. |
| **/dashboard** | [src/app/dashboard/page.tsx](file:///c:/Users/hp/OneDrive/Desktop/My-Projects/NEXT/gridwise/src/app/dashboard/page.tsx) | Real-time power load meter, peak tariff alert banner, today units & monthly projected bill cards, 24-hour demand vs solar curve (AreaChart), category consumption donut chart, quick-toggle appliance switches, and AI optimization tips. |
| **/appliances** | [src/app/appliances/page.tsx](file:///c:/Users/hp/OneDrive/Desktop/My-Projects/NEXT/gridwise/src/app/appliances/page.tsx) | Complete inventory manager: instant ON/OFF toggling, category & status filtering, search, Add/Edit modal with preset auto-fill, rated power, run hours, schedule flexibility, and delete controls. |
| **/analytics** | [src/app/analytics/page.tsx](file:///c:/Users/hp/OneDrive/Desktop/My-Projects/NEXT/gridwise/src/app/analytics/page.tsx) | 24h / 7-Day / 6-Month charts, visual KSEB 6-tier slab progression bar, peak vs. off-peak demand ratio breakdown, and ranked top energy-guzzler appliances. |
| **/scheduler** | [src/app/scheduler/page.tsx](file:///c:/Users/hp/OneDrive/Desktop/My-Projects/NEXT/gridwise/src/app/scheduler/page.tsx) | 24-hour visual scheduling matrix highlighting the peak danger window (18:00–22:00) vs solar window (10:00–15:00), 1-click AI Smart Shift button to automatically move flexible loads and compute ₹ savings. |
| **/simulator** | [src/app/simulator/page.tsx](file:///c:/Users/hp/OneDrive/Desktop/My-Projects/NEXT/gridwise/src/app/simulator/page.tsx) | Interactive microgrid peak demand simulator with 4 presets and customizable sliders (households, ACs, EVs, pumps, load shift %). Displays side-by-side uncoordinated vs coordinated load curves and shaved peak stats. |
| **/solar** | [src/app/solar/page.tsx](file:///c:/Users/hp/OneDrive/Desktop/My-Projects/NEXT/gridwise/src/app/solar/page.tsx) | Rooftop solar generator telemetry (3 kWp, 10 panels), 5 kWh battery storage gauge (65% SoC), real-time 3-way power routing (self-consumption, battery charging, net-metering grid export), and CO2 abatement metric. |
| **/reports** | [src/app/reports/page.tsx](file:///c:/Users/hp/OneDrive/Desktop/My-Projects/NEXT/gridwise/src/app/reports/page.tsx) | Comprehensive energy audit document with telescopic slab line items, fixed charges, 10% duty, appliance-level breakdown table, CSV export, and print/PDF support. |
| **/settings** | [src/app/settings/page.tsx](file:///c:/Users/hp/OneDrive/Desktop/My-Projects/NEXT/gridwise/src/app/settings/page.tsx) | Household parameter configurations (sanctioned load kW, tariff rate ₹, area, occupants), solar plant ratings, display theme toggle, and factory reset button. |
| **404** | [src/app/not-found.tsx](file:///c:/Users/hp/OneDrive/Desktop/My-Projects/NEXT/gridwise/src/app/not-found.tsx) | Clean fallback page for unknown routes. |

---

## 4. How to Run the App
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. All routes, toggles, charts, calculations, and themes are 100% interactive and working out of the box.
