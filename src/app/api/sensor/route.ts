import { supabase } from "@/lib/supabase";
import {
  insertEvent,
  openSession,
  getOpenSession,
  closeSession,
  getAppliances,
} from "@/lib/db";

// POST /api/sensor
// Body: { appliance_id: string, event_type: "on" | "off", source?: "manual" | "sensor" }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { appliance_id, event_type, source = "sensor" } = body;

    if (!appliance_id || !event_type) {
      return Response.json({ error: "appliance_id and event_type are required" }, { status: 400 });
    }
    if (event_type !== "on" && event_type !== "off") {
      return Response.json({ error: "event_type must be 'on' or 'off'" }, { status: 400 });
    }

    // Get appliance details for energy calculation
    const appliances = await getAppliances();
    const appliance = appliances.find((a) => a.id === appliance_id);
    if (!appliance) {
      return Response.json({ error: "Appliance not found" }, { status: 404 });
    }

    // 1. Log the raw event
    await insertEvent(appliance_id, event_type, source);

    // 2. Manage sessions
    if (event_type === "on") {
      // Close any dangling open session first
      const open = await getOpenSession(appliance_id);
      if (open) {
        await closeSession(open.id, appliance_id, appliance.rated_power_w, appliance.quantity);
      }
      await openSession(appliance_id);
    } else {
      // Close open session and calculate energy
      const open = await getOpenSession(appliance_id);
      if (open) {
        await closeSession(open.id, appliance_id, appliance.rated_power_w, appliance.quantity);
      }
    }

    // 3. Update appliance status in DB
    await supabase
      .from("appliances")
      .update({ status: event_type, updated_at: new Date().toISOString() })
      .eq("id", appliance_id);

    return Response.json({ success: true, appliance_id, event_type });
  } catch (err) {
    console.error("Sensor API error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/sensor?appliance_id=xxx — get latest status + open session
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const applianceId = searchParams.get("appliance_id");

  if (!applianceId) {
    return Response.json({ error: "appliance_id is required" }, { status: 400 });
  }

  const { data: appliance } = await supabase
    .from("appliances")
    .select("id, name, status")
    .eq("id", applianceId)
    .single();

  const openSession = await getOpenSession(applianceId);

  return Response.json({
    appliance,
    open_session: openSession,
    is_running: !!openSession,
  });
}
