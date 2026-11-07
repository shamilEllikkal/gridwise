import { getRecentSessions } from "@/lib/db";

// GET /api/sessions?days=30
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") ?? "30", 10);

  const sessions = await getRecentSessions(days);

  // Aggregate total energy & duration per appliance
  const byAppliance: Record<string, { energy_kwh: number; duration_minutes: number; session_count: number }> = {};

  for (const s of sessions) {
    if (!s.appliance_id) continue;
    if (!byAppliance[s.appliance_id]) {
      byAppliance[s.appliance_id] = { energy_kwh: 0, duration_minutes: 0, session_count: 0 };
    }
    byAppliance[s.appliance_id].energy_kwh += s.energy_kwh ?? 0;
    byAppliance[s.appliance_id].duration_minutes += s.duration_minutes ?? 0;
    byAppliance[s.appliance_id].session_count += 1;
  }

  return Response.json({ sessions, by_appliance: byAppliance });
}
