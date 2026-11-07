import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Database Types ───────────────────────────────────────────

export interface DbAppliance {
  id: string;
  household_id: string;
  name: string;
  category: string;
  rated_power_w: number;
  quantity: number;
  status: string;
  daily_hours: number;
  schedule_start: string | null;
  schedule_end: string | null;
  schedule_type: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbApplianceEvent {
  id: string;
  appliance_id: string;
  household_id: string;
  event_type: "on" | "off";
  timestamp: string;
  source: "manual" | "sensor" | "scheduled";
}

export interface DbApplianceSession {
  id: string;
  appliance_id: string;
  household_id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  energy_kwh: number | null;
}

export interface DbHousehold {
  id: string;
  name: string;
  location: string;
  area_sqft: number;
  occupants: number;
  tariff_rate: number;
  connected_load_kw: number;
  created_at: string;
  updated_at: string;
}
