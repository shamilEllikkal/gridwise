"use client";

import { useEffect, useState } from "react";
import { Activity, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface Session {
  id: string;
  appliance_id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  energy_kwh: number | null;
}

interface ApplianceMap {
  [id: string]: string;
}

export function SessionsPanel({ applianceNames }: { applianceNames: ApplianceMap }) {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    // Initial load — last 20 sessions
    supabase
      .from("appliance_sessions")
      .select("*")
      .eq("household_id", "demo-household-001")
      .order("started_at", { ascending: false })
      .limit(20)
      .then(({ data }) => { if (data) setSessions(data); });

    // Realtime — new sessions + closed sessions
    const channel = supabase
      .channel("sessions-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "appliance_sessions" }, () => {
        supabase
          .from("appliance_sessions")
          .select("*")
          .eq("household_id", "demo-household-001")
          .order("started_at", { ascending: false })
          .limit(20)
          .then(({ data }) => { if (data) setSessions(data); });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "—";
    if (minutes < 60) return `${Math.round(minutes)}m`;
    return `${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}m`;
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold">Recent Appliance Use</h2>
        </div>
        <span className="text-xs text-muted-foreground">
          {sessions.filter(s => !s.ended_at).length} running now
        </span>
      </div>

      {sessions.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">
          No appliance use recorded yet. Switch an appliance on to start tracking.
        </p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {sessions.map((s) => (
            <div
              key={s.id}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs border transition-all",
                !s.ended_at
                  ? "bg-primary/10 border-primary/30"
                  : "bg-muted/20 border-border/50"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    !s.ended_at ? "bg-primary animate-pulse" : "bg-muted-foreground/40"
                  )}
                />
                <span className="font-medium truncate">
                  {applianceNames[s.appliance_id] ?? s.appliance_id}
                </span>
              </div>

              <div className="flex items-center gap-3 text-muted-foreground flex-shrink-0 ml-2">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(s.started_at)}
                  {s.ended_at ? ` → ${formatTime(s.ended_at)}` : " → now"}
                </span>
                {s.ended_at && (
                  <>
                    <span className="font-mono">{formatDuration(s.duration_minutes)}</span>
                    <span className="text-emerald-500 font-mono">
                      {s.energy_kwh ? `${(s.energy_kwh * 1000).toFixed(1)} Wh` : "—"}
                    </span>
                  </>
                )}
                {!s.ended_at && (
                  <span className="text-primary font-semibold">On now</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
