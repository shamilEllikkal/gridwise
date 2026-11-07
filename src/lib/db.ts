import { supabase } from "./supabase";
import type { Appliance, Household } from "@/types";

const HOUSEHOLD_ID = "demo-household-001";

// ─── Household ───────────────────────────────────────────────

export async function getHousehold(): Promise<Household | null> {
  const { data, error } = await supabase
    .from("households")
    .select("*")
    .eq("id", HOUSEHOLD_ID)
    .single();
  if (error) return null;
  return data as Household;
}

export async function upsertHousehold(household: Household) {
  const { error } = await supabase
    .from("households")
    .upsert({ ...household, updated_at: new Date().toISOString() });
  if (error) throw error;
}

// ─── Appliances ──────────────────────────────────────────────

export async function getAppliances(): Promise<Appliance[]> {
  const { data, error } = await supabase
    .from("appliances")
    .select("*")
    .eq("household_id", HOUSEHOLD_ID)
    .order("created_at");
  if (error) return [];
  return (data ?? []) as Appliance[];
}

export async function upsertAppliance(appliance: Appliance) {
  // Explicitly pick only the columns that exist in the DB schema
  const row = {
    id: appliance.id,
    household_id: appliance.household_id,
    name: appliance.name,
    category: appliance.category,
    rated_power_w: appliance.rated_power_w,
    quantity: appliance.quantity,
    status: appliance.status,
    daily_hours: appliance.daily_hours,
    schedule_start: appliance.schedule_start ?? null,
    schedule_end: appliance.schedule_end ?? null,
    schedule_type: appliance.schedule_type,
    is_active: appliance.is_active,
    notes: appliance.notes ?? null,
    created_at: appliance.created_at,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("appliances").upsert(row);
  if (error) throw error;
}

export async function deleteApplianceDb(id: string) {
  const { error } = await supabase.from("appliances").delete().eq("id", id);
  if (error) throw error;
}

// ─── Events ──────────────────────────────────────────────────

export async function insertEvent(
  applianceId: string,
  eventType: "on" | "off",
  source: "manual" | "sensor" | "scheduled" = "manual"
) {
  const { error } = await supabase.from("appliance_events").insert({
    appliance_id: applianceId,
    household_id: HOUSEHOLD_ID,
    event_type: eventType,
    timestamp: new Date().toISOString(),
    source,
  });
  if (error) throw error;
}

// ─── Sessions ────────────────────────────────────────────────

export async function getRecentSessions(limitDays = 30) {
  const since = new Date();
  since.setDate(since.getDate() - limitDays);

  const { data, error } = await supabase
    .from("appliance_sessions")
    .select("*")
    .eq("household_id", HOUSEHOLD_ID)
    .gte("started_at", since.toISOString())
    .order("started_at", { ascending: false });
  if (error) return [];
  return data ?? [];
}

export async function getSessionsForAppliance(applianceId: string, limitDays = 7) {
  const since = new Date();
  since.setDate(since.getDate() - limitDays);

  const { data, error } = await supabase
    .from("appliance_sessions")
    .select("*")
    .eq("appliance_id", applianceId)
    .gte("started_at", since.toISOString())
    .order("started_at", { ascending: false });
  if (error) return [];
  return data ?? [];
}

// ─── Open session (ON with no OFF yet) ───────────────────────

export async function getOpenSession(applianceId: string) {
  const { data } = await supabase
    .from("appliance_sessions")
    .select("*")
    .eq("appliance_id", applianceId)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .single();
  return data ?? null;
}

export async function openSession(applianceId: string) {
  const { error } = await supabase.from("appliance_sessions").insert({
    appliance_id: applianceId,
    household_id: HOUSEHOLD_ID,
    started_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function closeSession(
  sessionId: string,
  applianceId: string,
  ratedPowerW: number,
  quantity: number
) {
  const { data: session } = await supabase
    .from("appliance_sessions")
    .select("started_at")
    .eq("id", sessionId)
    .single();

  if (!session) return;

  const startedAt = new Date(session.started_at);
  const endedAt = new Date();
  const durationMinutes = (endedAt.getTime() - startedAt.getTime()) / 60000;
  const energyKwh = (ratedPowerW * quantity * durationMinutes) / 60 / 1000;

  const { error } = await supabase
    .from("appliance_sessions")
    .update({
      ended_at: endedAt.toISOString(),
      duration_minutes: Math.round(durationMinutes * 100) / 100,
      energy_kwh: Math.round(energyKwh * 10000) / 10000,
    })
    .eq("id", sessionId);
  if (error) throw error;
}
