"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  AlertTriangle,
  Clock,
  Layers,
} from "lucide-react";
import { useApp } from "@/components/providers/AppProvider";
import {
  generateDeterministicHourlyReadings,
  generateWeeklyData,
  generateMonthlyData,
} from "@/lib/calculations/energy";
import { TARIFF_SLABS, APPLIANCE_CATEGORIES } from "@/constants";
import { formatCurrency, formatKwh, cn } from "@/lib/utils";
import type { ApplianceCategory, ApplianceWithStats } from "@/types";

type PeriodFilter = "day" | "week" | "month";

export default function AnalyticsPage() {
  const { state, stats, enrichedAppliances } = useApp();
  const [period, setPeriod] = useState<PeriodFilter>("week");

  // Chart datasets
  const hourlyData = generateDeterministicHourlyReadings(state.appliances);
  const weeklyData = generateWeeklyData(state.appliances);
  const monthlyData = generateMonthlyData(state.appliances);

  // Peak vs Off-Peak calculation for the day
  const peakUnits = hourlyData
    .filter((d) => d.is_peak)
    .reduce((sum, d) => sum + d.energy_kwh, 0);
  const offPeakUnits = hourlyData
    .filter((d) => !d.is_peak)
    .reduce((sum, d) => sum + d.energy_kwh, 0);
  const peakRatio = stats.total_today_kwh > 0 ? (peakUnits / stats.total_today_kwh) * 100 : 0;

  // Sorted appliances by monthly consumption
  const sortedAppliances = [...enrichedAppliances].sort(
    (a, b) => b.monthly_kwh - a.monthly_kwh
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Electricity Use & Bill</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Check how much electricity your home uses and how the estimated bill changes.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border/80 self-start sm:self-auto">
          {(["day", "week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all",
                period === p
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {p === "day" ? "24 Hours" : p === "week" ? "Last 7 Days" : "Last 6 Months"}
            </button>
          ))}
        </div>
      </div>

      {/* Tariff Slab Progression Widget */}
      <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Estimated cost by monthly units</h2>
              <p className="text-xs text-muted-foreground">
                Current month: <strong>{stats.total_month_kwh} Units</strong> · Projected Bill:{" "}
                <strong>{formatCurrency(stats.estimated_month_bill)}</strong>
              </p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            KSEB-style estimate
          </span>
        </div>

        {/* Slabs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-2">
          {TARIFF_SLABS.map((slab, i) => {
            const prevMax = i > 0 ? TARIFF_SLABS[i - 1].max_units : 0;
            const isCurrent =
              stats.total_month_kwh > prevMax &&
              (slab.max_units === Infinity || stats.total_month_kwh <= slab.max_units);
            const isPassed = stats.total_month_kwh > slab.max_units;

            return (
              <div
                key={i}
                className={cn(
                  "p-3 rounded-xl border transition-all text-xs flex flex-col justify-between",
                  isCurrent
                    ? "bg-primary/15 border-primary text-foreground shadow-xs ring-1 ring-primary/30"
                    : isPassed
                    ? "bg-muted/40 border-border/50 text-muted-foreground"
                    : "bg-card border-border/40 text-muted-foreground/60"
                )}
              >
                <div className="flex items-center justify-between font-semibold mb-1">
                  <span>Slab {i + 1}</span>
                  {isCurrent && (
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                  )}
                </div>
                <div className="text-sm font-bold text-foreground">
                  ₹{slab.rate.toFixed(2)}/u
                </div>
                <div className="text-[11px] mt-1 text-muted-foreground">
                  {prevMax} - {slab.max_units === Infinity ? "250+" : `${slab.max_units}`} u
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Primary Chart based on active Period */}
      <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold capitalize">
              {period === "day"
                ? "24-Hour Load Curve"
                : period === "week"
                ? "Daily Units Consumed (Last 7 Days)"
                : "Monthly Trend & Bill History"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {period === "day"
                ? "Estimated electricity used each hour (units)"
                : period === "week"
                ? "Energy units and daily cost over the past week"
                : "Six-month seasonal demand variance"}
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {period === "day" ? (
              <AreaChart
                data={hourlyData.map((d) => ({
                  hour: `${d.hour.toString().padStart(2, "0")}:00`,
                  kwh: d.energy_kwh,
                  power_w: d.power_w,
                  is_peak: d.is_peak,
                }))}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="analyticsDayGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} tickLine={false} interval={3} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} unit=" kWh" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(20, 31, 24, 0.95)",
                    borderColor: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "0.75rem",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(value) => [`${value} kWh`, "Energy Used"]}
                />
                <Area
                  type="monotone"
                  dataKey="kwh"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#analyticsDayGrad)"
                />
              </AreaChart>
            ) : period === "week" ? (
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} unit=" u" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(20, 31, 24, 0.95)",
                    borderColor: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "0.75rem",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(value, name) => [
                    name === "kwh" ? `${value} Units` : `₹${value}`,
                    name === "kwh" ? "Energy" : "Estimated Cost",
                  ]}
                />
                <Bar dataKey="kwh" fill="#22c55e" radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : (
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} unit=" u" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(20, 31, 24, 0.95)",
                    borderColor: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "0.75rem",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(value, name) => [
                    name === "kwh" ? `${value} Units` : `₹${value}`,
                    name === "kwh" ? "Total Units" : "Monthly Bill",
                  ]}
                />
                <Bar dataKey="kwh" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Peak Analysis + Top Guzzlers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Peak vs Off-Peak Ratio (1 column) */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-amber-500" />
              <h2 className="text-base font-semibold">Use During Evening Busy Hours</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Estimated electricity used from 6–10 PM compared with the rest of the day.
            </p>

            <div className="space-y-4">
              {/* Peak Bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-amber-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Evening busy hours (6–10 PM)
                  </span>
                  <span className="font-mono tabular-nums font-semibold">
                    {formatKwh(peakUnits)} ({Math.round(peakRatio)}%)
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${Math.min(100, Math.round(peakRatio))}%` }}
                  />
                </div>
              </div>

              {/* Off-Peak Bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-emerald-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Other hours
                  </span>
                  <span className="font-mono tabular-nums font-semibold">
                    {formatKwh(offPeakUnits)} ({Math.round(100 - peakRatio)}%)
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.min(100, Math.round(100 - peakRatio))}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400">
              <div className="font-semibold mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Possible change
              </div>
              If you can move some flexible use ({formatKwh(peakUnits * 0.3)}) to sunny daytime hours, the estimated saving is{" "}
              <strong>₹{Math.round(peakUnits * 0.3 * 30 * state.household.tariff_rate)} / month (rough estimate)</strong>.
            </div>
          </div>
        </div>

        {/* Appliances Using the Most Electricity (2 columns) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-card border border-border/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold">Appliances Using the Most Electricity</h2>
              <p className="text-xs text-muted-foreground">
                Sorted by estimated monthly units and cost
              </p>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              Top {Math.min(5, sortedAppliances.length)} Devices
            </span>
          </div>

          <div className="space-y-3">
            {sortedAppliances.slice(0, 5).map((appliance: ApplianceWithStats, index: number) => {
              const maxKwh = sortedAppliances[0]?.monthly_kwh || 1;
              const percentOfMax = (appliance.monthly_kwh / maxKwh) * 100;
              const catInfo = APPLIANCE_CATEGORIES[appliance.category as ApplianceCategory];

              return (
                <div
                  key={appliance.id}
                  className="p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center font-bold text-[10px] text-muted-foreground">
                        #{index + 1}
                      </span>
                      <span className="font-semibold text-foreground text-sm">
                        {appliance.name}
                      </span>
                      <span className="text-muted-foreground text-[11px] capitalize">
                        ({appliance.category})
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-foreground tabular-nums">
                        {Math.round(appliance.monthly_kwh)} units/month
                      </span>
                      <span className="text-muted-foreground text-[11px] block">
                        {formatCurrency(appliance.monthly_cost)}
                      </span>
                    </div>
                  </div>

                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentOfMax}%`,
                        backgroundColor: catInfo?.color ?? "#22c55e",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
