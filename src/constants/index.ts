import type { ApplianceCategory } from "@/types";

// ─── App Constants ──────────────────────────────────────────

export const APP_NAME = "GRIDWISE";
export const APP_TAGLINE = "Monitor every unit. Understand every appliance. Optimise every decision.";
export const APP_VERSION = "1.0.0";
export const DEMO_HOUSEHOLD_ID = "demo-household-001";
export const DEMO_COMMUNITY_ID = "demo-community-001";

// ─── Energy Constants ───────────────────────────────────────

export const DEFAULT_TARIFF_RATE = 6.5; // ₹ per kWh (Kerala KSEB domestic rate)
export const PEAK_HOURS = [7, 8, 9, 18, 19, 20, 21, 22]; // Hours (24h)
export const SOLAR_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16]; // Peak solar hours
export const CO2_PER_KWH = 0.82; // kg CO2 per kWh (India grid average)
export const DAYS_IN_MONTH = 30;

// ─── Tariff Slabs (KSEB-inspired) ───────────────────────────

export const TARIFF_SLABS = [
  { max_units: 50, rate: 3.15, fixed_charge: 25 },
  { max_units: 100, rate: 4.5, fixed_charge: 35 },
  { max_units: 150, rate: 5.8, fixed_charge: 50 },
  { max_units: 200, rate: 6.5, fixed_charge: 65 },
  { max_units: 250, rate: 7.5, fixed_charge: 80 },
  { max_units: Infinity, rate: 8.0, fixed_charge: 100 },
];

// ─── Appliance Defaults ─────────────────────────────────────

export const APPLIANCE_DEFAULTS: Record<
  string,
  { power_w: number; daily_hours: number; category: ApplianceCategory }
> = {
  "LED Bulb (9W)": { power_w: 9, daily_hours: 6, category: "lighting" },
  "LED Bulb (18W)": { power_w: 18, daily_hours: 6, category: "lighting" },
  "CFL Lamp": { power_w: 25, daily_hours: 6, category: "lighting" },
  "Ceiling Fan": { power_w: 75, daily_hours: 8, category: "cooling" },
  "Table Fan": { power_w: 55, daily_hours: 6, category: "cooling" },
  "Split AC (1 Ton)": { power_w: 900, daily_hours: 8, category: "cooling" },
  "Split AC (1.5 Ton)": { power_w: 1350, daily_hours: 8, category: "cooling" },
  "Split AC (2 Ton)": { power_w: 1800, daily_hours: 8, category: "cooling" },
  "Refrigerator (200L)": { power_w: 150, daily_hours: 24, category: "kitchen" },
  "Refrigerator (350L)": { power_w: 250, daily_hours: 24, category: "kitchen" },
  "Microwave Oven": { power_w: 1200, daily_hours: 0.5, category: "kitchen" },
  "Induction Cooktop": { power_w: 2000, daily_hours: 1.5, category: "kitchen" },
  "Electric Kettle": { power_w: 1500, daily_hours: 0.25, category: "kitchen" },
  "Mixer Grinder": { power_w: 500, daily_hours: 0.25, category: "kitchen" },
  "Television (32in)": { power_w: 60, daily_hours: 5, category: "entertainment" },
  "Television (55in)": { power_w: 150, daily_hours: 5, category: "entertainment" },
  "Washing Machine": { power_w: 500, daily_hours: 1, category: "laundry" },
  "Clothes Dryer": { power_w: 2500, daily_hours: 1, category: "laundry" },
  "Water Pump (0.5HP)": { power_w: 373, daily_hours: 1.5, category: "water" },
  "Water Pump (1HP)": { power_w: 746, daily_hours: 1.5, category: "water" },
  "Water Heater (Geyser)": { power_w: 2000, daily_hours: 1, category: "water" },
  "Desktop Computer": { power_w: 300, daily_hours: 8, category: "computing" },
  "Laptop": { power_w: 65, daily_hours: 8, category: "computing" },
  "Router/Modem": { power_w: 15, daily_hours: 24, category: "computing" },
  "EV Charger (7.4kW)": { power_w: 7400, daily_hours: 2, category: "ev" },
  "EV Charger (3.3kW)": { power_w: 3300, daily_hours: 3, category: "ev" },
};

export const APPLIANCE_CATEGORIES: Record<ApplianceCategory, { label: string; color: string; icon: string }> = {
  lighting: { label: "Lighting", color: "#F59E0B", icon: "Lightbulb" },
  cooling: { label: "Cooling & Fans", color: "#60A5FA", icon: "Wind" },
  heating: { label: "Heating", color: "#F97316", icon: "Flame" },
  kitchen: { label: "Kitchen", color: "#A78BFA", icon: "ChefHat" },
  entertainment: { label: "Entertainment", color: "#EC4899", icon: "Tv" },
  laundry: { label: "Laundry", color: "#14B8A6", icon: "WashingMachine" },
  water: { label: "Water", color: "#3B82F6", icon: "Droplets" },
  computing: { label: "Computing", color: "#8B5CF6", icon: "Monitor" },
  ev: { label: "EV Charging", color: "#22C55E", icon: "Zap" },
  other: { label: "Other", color: "#6B7280", icon: "Package" },
};

// ─── Chart Colors ───────────────────────────────────────────

export const CHART_COLORS = [
  "#22C55E", // green
  "#60A5FA", // blue
  "#F59E0B", // amber
  "#A78BFA", // purple
  "#F97316", // orange
  "#EC4899", // pink
  "#14B8A6", // teal
  "#EF4444", // red
  "#84CC16", // lime
  "#06B6D4", // cyan
];

// ─── Navigation Items ───────────────────────────────────────

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/appliances", label: "Appliances", icon: "Plug" },
  { href: "/analytics", label: "Analytics", icon: "BarChart3" },
  { href: "/scheduler", label: "Smart Scheduler", icon: "CalendarClock" },
  { href: "/community", label: "Community", icon: "Users" },
  { href: "/simulator", label: "Peak Simulator", icon: "Activity" },
  { href: "/solar", label: "Solar Energy", icon: "Sun" },
  { href: "/reports", label: "Reports", icon: "FileText" },
  { href: "/settings", label: "Settings", icon: "Settings" },
] as const;

// ─── Simulation Presets ─────────────────────────────────────

export const SIMULATION_PRESETS = [
  {
    id: "normal",
    label: "Normal Household",
    description: "Typical daily consumption pattern",
    config: {
      num_households: 50,
      num_ac_units: 1,
      ac_power_w: 1200,
      num_ev_chargers: 0,
      ev_power_w: 7400,
      num_water_pumps: 1,
      pump_power_w: 500,
      num_washing_machines: 1,
      washing_power_w: 500,
      base_load_w: 300,
      flexible_shift_percent: 40,
      peak_start_hour: 18,
      peak_end_hour: 22,
    },
  },
  {
    id: "evening_peak",
    label: "Evening Peak",
    description: "High demand during evening hours",
    config: {
      num_households: 100,
      num_ac_units: 2,
      ac_power_w: 1500,
      num_ev_chargers: 1,
      ev_power_w: 7400,
      num_water_pumps: 1,
      pump_power_w: 500,
      num_washing_machines: 1,
      washing_power_w: 600,
      base_load_w: 400,
      flexible_shift_percent: 30,
      peak_start_hour: 18,
      peak_end_hour: 23,
    },
  },
  {
    id: "coordinated",
    label: "Coordinated Community",
    description: "Smart coordination across households",
    config: {
      num_households: 200,
      num_ac_units: 1,
      ac_power_w: 1200,
      num_ev_chargers: 1,
      ev_power_w: 3300,
      num_water_pumps: 1,
      pump_power_w: 373,
      num_washing_machines: 1,
      washing_power_w: 500,
      base_load_w: 250,
      flexible_shift_percent: 70,
      peak_start_hour: 18,
      peak_end_hour: 21,
    },
  },
  {
    id: "solar_assisted",
    label: "Solar-Assisted",
    description: "With rooftop solar during peak hours",
    config: {
      num_households: 75,
      num_ac_units: 1,
      ac_power_w: 900,
      num_ev_chargers: 0,
      ev_power_w: 3300,
      num_water_pumps: 1,
      pump_power_w: 373,
      num_washing_machines: 1,
      washing_power_w: 500,
      base_load_w: 200,
      flexible_shift_percent: 60,
      peak_start_hour: 11,
      peak_end_hour: 15,
    },
  },
] as const;
