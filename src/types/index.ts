// ============================================================
// GRIDWISE — Core TypeScript Types
// ============================================================

// ─── Enums ──────────────────────────────────────────────────

export type ApplianceCategory =
  | "lighting"
  | "cooling"
  | "heating"
  | "kitchen"
  | "entertainment"
  | "laundry"
  | "water"
  | "computing"
  | "ev"
  | "other";

export type ApplianceStatus = "on" | "off" | "scheduled" | "error";

export type ScheduleType = "flexible" | "essential" | "scheduled";

export type PeriodFilter = "day" | "week" | "month";

export type EnergyTrend = "up" | "down" | "stable";

// ─── Household ──────────────────────────────────────────────

export interface Household {
  id: string;
  name: string;
  location: string;
  area_sqft: number;
  occupants: number;
  tariff_rate: number; // ₹ per kWh
  connected_load_kw: number;
  created_at: string;
  updated_at: string;
}

// ─── Appliance ──────────────────────────────────────────────

export interface Appliance {
  id: string;
  household_id: string;
  name: string;
  category: ApplianceCategory;
  brand?: string;
  model?: string;
  rated_power_w: number;    // Watts
  quantity: number;
  status: ApplianceStatus;
  daily_hours: number;      // Operating hours per day
  schedule_start?: string;  // "HH:MM"
  schedule_end?: string;    // "HH:MM"
  schedule_days?: number[]; // 0=Sun, 1=Mon...6=Sat
  schedule_type: ScheduleType;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Derived / computed fields
export interface ApplianceWithStats extends Appliance {
  daily_kwh: number;        // rated_power_w × quantity × daily_hours / 1000
  monthly_kwh: number;      // daily_kwh × 30
  monthly_cost: number;     // monthly_kwh × tariff_rate
  percentage_of_total: number;
}

// ─── Energy Readings ────────────────────────────────────────

export interface EnergyReading {
  id: string;
  household_id: string;
  timestamp: string;        // ISO 8601
  total_power_w: number;    // Instantaneous watts
  total_energy_kwh: number; // Cumulative kWh for that hour
  solar_generation_w?: number;
  grid_import_w?: number;
  battery_level?: number;   // 0–100%
  is_peak_hour: boolean;
}

export interface HourlyReading {
  hour: number;             // 0–23
  energy_kwh: number;
  power_w: number;
  is_peak: boolean;
}

// ─── Schedule ───────────────────────────────────────────────

export interface Schedule {
  id: string;
  appliance_id: string;
  household_id: string;
  original_start: string;
  original_end: string;
  recommended_start?: string;
  recommended_end?: string;
  days: number[];
  is_flexible: boolean;
  reason?: string;
  accepted: boolean;
  created_at: string;
}

// ─── Community ──────────────────────────────────────────────

export interface Community {
  id: string;
  name: string;
  location: string;
  total_households: number;
  avg_tariff_rate: number;
  created_at: string;
}

export interface CommunityMember {
  id: string;
  community_id: string;
  household_id: string;
  participation_score: number; // 0–100
  joined_at: string;
}

// ─── Solar Profile ──────────────────────────────────────────

export interface SolarProfile {
  id: string;
  household_id: string;
  panel_capacity_kw: number;
  panel_count: number;
  panel_efficiency: number;   // 0–1
  battery_capacity_kwh: number;
  battery_level: number;      // 0–100%
  installation_date: string;
  facing: "north" | "south" | "east" | "west" | "flat";
  tilt_angle: number;
  created_at: string;
}

// ─── Simulation ─────────────────────────────────────────────

export interface SimulationConfig {
  num_households: number;
  num_ac_units: number;
  ac_power_w: number;
  num_ev_chargers: number;
  ev_power_w: number;
  num_water_pumps: number;
  pump_power_w: number;
  num_washing_machines: number;
  washing_power_w: number;
  base_load_w: number;        // Per household base load
  flexible_shift_percent: number; // 0–100
  peak_start_hour: number;    // e.g. 18 (6 PM)
  peak_end_hour: number;      // e.g. 22 (10 PM)
}

export interface SimulationResult {
  original_peak_kw: number;
  optimised_peak_kw: number;
  peak_reduction_kw: number;
  peak_reduction_percent: number;
  total_flexible_kwh: number;
  hourly_original: HourlyDemand[];
  hourly_optimised: HourlyDemand[];
}

export interface HourlyDemand {
  hour: number;
  original_kw: number;
  optimised_kw: number;
  flexible_kw: number;
  essential_kw: number;
}

// ─── Activity Log ───────────────────────────────────────────

export interface ActivityLog {
  id: string;
  household_id: string;
  event_type: "appliance_on" | "appliance_off" | "schedule_updated" | "recommendation" | "appliance_added" | "appliance_deleted" | "settings_changed";
  description: string;
  appliance_id?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

// ─── Dashboard Stats ────────────────────────────────────────

export interface DashboardStats {
  total_today_kwh: number;
  total_month_kwh: number;
  estimated_month_bill: number;
  current_power_w: number;
  active_appliances: number;
  total_appliances: number;
  peak_hour: number;
  avg_daily_kwh: number;
  potential_savings_kwh: number;
  solar_generation_today_kwh: number;
  grid_import_today_kwh: number;
  co2_saved_kg: number;
}

// ─── Chart Data ─────────────────────────────────────────────

export interface ChartDataPoint {
  label: string;
  value: number;
  secondary?: number;
  color?: string;
}

export interface ApplianceChartData {
  name: string;
  kwh: number;
  cost: number;
  percentage: number;
  color: string;
  category: ApplianceCategory;
}

// ─── Recommendations ────────────────────────────────────────

export interface Recommendation {
  id: string;
  type: "shift_schedule" | "reduce_usage" | "upgrade_appliance" | "solar_opportunity" | "community_coordination";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  potential_savings_kwh: number;
  potential_savings_rupees: number;
  appliance_id?: string;
  action_label?: string;
}

// ─── Report ─────────────────────────────────────────────────

export interface ReportSummary {
  period: "daily" | "weekly" | "monthly";
  start_date: string;
  end_date: string;
  total_kwh: number;
  total_cost: number;
  avg_daily_kwh: number;
  peak_day?: string;
  peak_hour?: number;
  top_appliances: ApplianceChartData[];
  solar_generation_kwh: number;
  co2_saved_kg: number;
}
