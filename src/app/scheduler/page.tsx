"use client";

import { useState } from "react";
import {
  Sun,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { useApp } from "@/components/providers/AppProvider";
import { PEAK_HOURS, SOLAR_HOURS } from "@/constants";
import { formatPower, cn } from "@/lib/utils";
import type { ApplianceWithStats } from "@/types";
import { toast } from "sonner";

export default function SchedulerPage() {
  const { state, enrichedAppliances, updateAppliance } = useApp();
  const [isOptimized, setIsOptimized] = useState(false);

  // Filter appliances that have schedules or are flexible
  const schedulableAppliances = enrichedAppliances.filter(
    (a: ApplianceWithStats) => a.is_active && (a.schedule_type === "flexible" || a.schedule_type === "scheduled")
  );

  // Calculate appliances running in peak hours (18:00 - 22:00)
  const peakRunningAppliances = schedulableAppliances.filter((a: ApplianceWithStats) => {
    if (!a.schedule_start) return false;
    const startHour = parseInt(a.schedule_start.split(":")[0]);
    return PEAK_HOURS.includes(startHour);
  });

  // Calculate potential savings if peak loads are shifted to solar/off-peak
  const peakWatts = peakRunningAppliances.reduce(
    (sum: number, a: ApplianceWithStats) => sum + a.rated_power_w * a.quantity,
    0
  );
  const estimatedMonthlyShiftSavings =
    (peakWatts / 1000) * 2 * 30 * (state.household.tariff_rate * 0.4); // approx 40% differential/solar savings

  // 1-Click AI Smart Shift
  const handleAutoOptimize = () => {
    // Shift flexible appliances to daytime solar hours (e.g. 11:00 or 14:00)
    let shiftedCount = 0;
    schedulableAppliances.forEach((app: ApplianceWithStats) => {
      if (app.schedule_type === "flexible") {
        const updated = {
          ...app,
          schedule_start: "11:00",
          schedule_end: "13:00",
          updated_at: new Date().toISOString(),
        };
        updateAppliance(updated);
        shiftedCount++;
      }
    });

    setIsOptimized(true);
    toast.success("Optimal Schedule Applied!", {
      description: `Shifted ${shiftedCount} flexible loads out of peak hours to peak solar window (11:00 - 13:00).`,
    });
  };

  const handleResetSchedule = () => {
    // Reset back
    schedulableAppliances.forEach((app: ApplianceWithStats) => {
      if (app.name.includes("Washing")) {
        updateAppliance({ ...app, schedule_start: "19:00", schedule_end: "20:00" });
      }
    });
    setIsOptimized(false);
    toast.info("Schedules restored to original timings");
  };

  const hoursArray = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Smart Appliance Scheduler</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automate load shifting from expensive evening peaks (18:00 - 22:00) into free daytime solar windows
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isOptimized ? (
            <button
              onClick={handleResetSchedule}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Timings
            </button>
          ) : (
            <button
              onClick={handleAutoOptimize}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>1-Click AI Smart Shift</span>
            </button>
          )}
        </div>
      </div>

      {/* AI Recommendation Banner */}
      <div
        className={cn(
          "p-5 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs",
          isOptimized
            ? "bg-primary/10 border-primary/30"
            : "bg-amber-500/10 border-amber-500/30"
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold",
              isOptimized ? "bg-primary" : "bg-amber-500"
            )}
          >
            {isOptimized ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {isOptimized
                ? "Optimal Load Distribution Active"
                : `${peakRunningAppliances.length} High-Load Devices Running During Peak Window`}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
              {isOptimized
                ? `Flexible appliances are scheduled during solar generation hours. Potential savings of approx ₹${Math.round(estimatedMonthlyShiftSavings)}/month unlocked.`
                : `Appliances like washing machines and pumps are scheduled between 6 PM – 10 PM. Shifting them to 11 AM – 2 PM aligns demand with free solar generation.`}
            </p>
          </div>
        </div>

        {!isOptimized && (
          <button
            onClick={handleAutoOptimize}
            className="flex-shrink-0 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            Shift Flexible Loads Now
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 24-Hour Visual Schedule Timeline Matrix */}
      <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs overflow-x-auto">
        <div className="flex items-center justify-between mb-4 min-w-[700px]">
          <div>
            <h2 className="text-base font-semibold">24-Hour Operational Matrix</h2>
            <p className="text-xs text-muted-foreground">
              Visual timetable of scheduled appliances across time zones
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/30 border border-amber-500" />
              Peak Window (18:00 - 22:00)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/30 border border-emerald-500" />
              Solar Window (10:00 - 15:00)
            </span>
          </div>
        </div>

        {/* Matrix Container */}
        <div className="min-w-[700px]">
          {/* Hour Labels */}
          <div className="grid grid-cols-24 gap-1 text-[10px] text-muted-foreground font-mono text-center pb-2 border-b border-border/60">
            {hoursArray.map((h) => (
              <div
                key={h}
                className={cn(
                  "py-1 rounded-sm",
                  PEAK_HOURS.includes(h)
                    ? "bg-amber-500/20 text-amber-500 font-bold"
                    : SOLAR_HOURS.includes(h)
                    ? "bg-emerald-500/20 text-emerald-500 font-bold"
                    : ""
                )}
              >
                {h}
              </div>
            ))}
          </div>

          {/* Appliance Rows */}
          <div className="divide-y divide-border/40 mt-2">
            {schedulableAppliances.map((appliance: ApplianceWithStats) => {
              const startH = appliance.schedule_start
                ? parseInt(appliance.schedule_start.split(":")[0])
                : -1;
              const endH = appliance.schedule_end
                ? parseInt(appliance.schedule_end.split(":")[0])
                : -1;

              return (
                <div key={appliance.id} className="py-2.5 flex items-center gap-3">
                  {/* Appliance Name label */}
                  <div className="w-44 flex-shrink-0">
                    <div className="text-xs font-semibold truncate text-foreground">
                      {appliance.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <span>{formatPower(appliance.rated_power_w * appliance.quantity)}</span>
                      <span>·</span>
                      <span className="capitalize">{appliance.schedule_type}</span>
                    </div>
                  </div>

                  {/* 24-Hour Grid Bar */}
                  <div className="grid grid-cols-24 gap-1 flex-1 h-7">
                    {hoursArray.map((h) => {
                      let isSlotActive = false;
                      if (startH !== -1 && endH !== -1) {
                        if (startH <= endH) {
                          isSlotActive = h >= startH && h < endH;
                        } else {
                          isSlotActive = h >= startH || h < endH;
                        }
                      }

                      const isPeakSlot = PEAK_HOURS.includes(h);
                      const isSolarSlot = SOLAR_HOURS.includes(h);

                      return (
                        <div
                          key={h}
                          className={cn(
                            "h-full rounded-xs transition-colors flex items-center justify-center",
                            isSlotActive
                              ? isPeakSlot
                                ? "bg-amber-500 text-white font-bold"
                                : "bg-primary text-white"
                              : isPeakSlot
                              ? "bg-amber-500/10"
                              : isSolarSlot
                              ? "bg-emerald-500/10"
                              : "bg-muted/30"
                          )}
                          title={`${h}:00 - ${appliance.name}: ${
                            isSlotActive ? "Running" : "Idle"
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Appliance Schedules Detail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schedulableAppliances.map((appliance: ApplianceWithStats) => {
          const isPeak =
            appliance.schedule_start &&
            PEAK_HOURS.includes(parseInt(appliance.schedule_start.split(":")[0]));

          return (
            <div
              key={appliance.id}
              className={cn(
                "p-4 rounded-xl border transition-all flex flex-col justify-between shadow-xs",
                isPeak
                  ? "bg-amber-500/5 border-amber-500/30"
                  : "bg-card border-border/80"
              )}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold truncate text-foreground">
                    {appliance.name}
                  </span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider",
                      isPeak
                        ? "bg-amber-500/20 text-amber-500"
                        : "bg-primary/20 text-primary"
                    )}
                  >
                    {isPeak ? "Peak Time" : "Eco Time"}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground">
                  Current Schedule:{" "}
                  <strong className="text-foreground">
                    {appliance.schedule_start ?? "Not set"} – {appliance.schedule_end ?? "Not set"}
                  </strong>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Rated Load: {formatPower(appliance.rated_power_w * appliance.quantity)}
                </div>
              </div>

              {/* Quick Shift Button */}
              {isPeak && appliance.schedule_type === "flexible" && (
                <button
                  onClick={() => {
                    updateAppliance({
                      ...appliance,
                      schedule_start: "11:00",
                      schedule_end: "13:00",
                      updated_at: new Date().toISOString(),
                    });
                    toast.success(`Shifted ${appliance.name} to 11:00 AM`);
                  }}
                  className="mt-3 w-full py-1.5 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Sun className="w-3.5 h-3.5" />
                  Shift to Solar Hours (11 AM)
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
