"use client";

import {
  Sun,
  BatteryCharging,
  Zap,
  Leaf,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { useApp } from "@/components/providers/AppProvider";
import {
  generateDeterministicHourlyReadings,
  generateHourlySolar,
  calcCo2Saved,
} from "@/lib/calculations/energy";
import { formatCurrency, formatPower } from "@/lib/utils";

export default function SolarPage() {
  const { state, stats } = useApp();
  const solar = state.solar;

  // Daily solar estimate: capacity * 4.5 peak sun hours * efficiency factor
  const dailySolarKwh = Math.round(solar.panel_capacity_kw * 4.5 * 10) / 10;
  const monthlySolarKwh = Math.round(dailySolarKwh * 30);
  const monthlySolarSavings = Math.round(monthlySolarKwh * state.household.tariff_rate);
  const co2SavedMonthKg = Math.round(calcCo2Saved(monthlySolarKwh));

  // Hourly curves
  const hourlyData = generateDeterministicHourlyReadings(state.appliances);
  const solarHourly = generateHourlySolar(dailySolarKwh);

  const chartData = hourlyData.map((d) => {
    const s = solarHourly.find((sh) => sh.hour === d.hour)?.solar_kw ?? 0;
    const solarW = Math.round(s * 1000);
    return {
      hour: `${d.hour.toString().padStart(2, "0")}:00`,
      solarW,
      loadW: d.power_w,
      gridImportW: Math.max(0, d.power_w - solarW),
      gridExportW: Math.max(0, solarW - d.power_w),
    };
  });

  // Current real-time solar generation estimate at midday (or scale by current hour)
  const currentHour = new Date().getHours();
  const currentSolarFraction =
    solarHourly.find((s) => s.hour === currentHour)?.solar_kw ?? 0;
  const currentSolarW = Math.round(currentSolarFraction * 1000);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rooftop Solar & Storage</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time generation telemetry, battery charge status, and net-metering feed-in credits
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 text-xs font-semibold flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5" />
            {solar.panel_capacity_kw} kW Monocrystalline PV
          </span>
        </div>
      </div>

      {/* 4 Solar KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Estimated Today's Generation */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Today&apos;s Solar Gen</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Sun className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold tabular-nums text-amber-500">
            {dailySolarKwh} kWh
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Worth approx {formatCurrency(dailySolarKwh * state.household.tariff_rate)} today
          </div>
        </div>

        {/* Card 2: Battery Storage Status */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Li-Ion Battery Pack</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <BatteryCharging className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums text-foreground">
              {solar.battery_level}%
            </span>
            <span className="text-xs text-muted-foreground">
              ({((solar.battery_capacity_kwh * solar.battery_level) / 100).toFixed(1)} / {solar.battery_capacity_kwh} kWh)
            </span>
          </div>
          <div className="mt-2 text-xs text-emerald-500 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Ready for evening backup
          </div>
        </div>

        {/* Card 3: Monthly Net Savings */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Monthly Solar Credit</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold tabular-nums text-foreground">
            {formatCurrency(monthlySolarSavings)}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {monthlySolarKwh} kWh self-generated / month
          </div>
        </div>

        {/* Card 4: CO2 Footprint Reduction */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Carbon Abatement</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold tabular-nums text-emerald-500">
            {co2SavedMonthKg} kg
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Equivalent to planting {Math.round(co2SavedMonthKg / 20)} mature trees
          </div>
        </div>
      </div>

      {/* Energy Flow Telemetry Widget */}
      <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs">
        <h2 className="text-base font-semibold mb-1">Live Power Flow Routing</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Real-time split of generated solar energy across self-consumption, storage, and grid feed-in
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Flow 1: Direct Consumption */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
            <span className="text-xs text-muted-foreground font-medium uppercase">
              1. Direct Self-Consumption
            </span>
            <div className="text-2xl font-bold text-foreground mt-1 tabular-nums">
              {formatPower(Math.min(currentSolarW, stats.current_power_w))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Powers active home appliances with zero grid pull
            </p>
          </div>

          {/* Flow 2: Battery Charging */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
            <span className="text-xs text-muted-foreground font-medium uppercase">
              2. Battery Storage Feed
            </span>
            <div className="text-2xl font-bold text-purple-400 mt-1 tabular-nums">
              {formatPower(currentSolarW > 500 ? 450 : 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Charges 5 kWh Li-Ion pack for evening peak use
            </p>
          </div>

          {/* Flow 3: Net Metering Export */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
            <span className="text-xs text-muted-foreground font-medium uppercase">
              3. Grid Feed-In Export
            </span>
            <div className="text-2xl font-bold text-emerald-500 mt-1 tabular-nums">
              {formatPower(Math.max(0, currentSolarW - stats.current_power_w - 450))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Surplus exported to KSEB grid under net metering
            </p>
          </div>
        </div>
      </div>

      {/* 24-Hour Solar Generation vs Load Curve */}
      <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-semibold">Solar Generation vs Household Demand</h2>
            <p className="text-xs text-muted-foreground">
              Peak solar output window (10:00 – 16:00) compared against total home power load
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Solar Gen (W)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Home Demand (W)
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="solarGenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="demandGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} tickLine={false} interval={2} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} unit=" W" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(20, 31, 24, 0.95)",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "0.75rem",
                  color: "#fff",
                  fontSize: "12px",
                }}
                formatter={(val, name) => [
                  `${val} W`,
                  name === "solarW" ? "Solar Generation" : "Household Demand",
                ]}
              />
              <Area
                type="monotone"
                dataKey="solarW"
                stroke="#f59e0b"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#solarGenGrad)"
              />
              <Area
                type="monotone"
                dataKey="loadW"
                stroke="#22c55e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#demandGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* PV System Hardware Specifications Card */}
      <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs">
        <h2 className="text-base font-semibold mb-3">Rooftop Solar Plant Specifications</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
            <span className="text-muted-foreground block text-[11px]">System Capacity</span>
            <span className="font-bold text-foreground text-sm mt-0.5 block">
              {solar.panel_capacity_kw} kWp
            </span>
          </div>

          <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
            <span className="text-muted-foreground block text-[11px]">Module Count</span>
            <span className="font-bold text-foreground text-sm mt-0.5 block">
              {solar.panel_count} Panels
            </span>
          </div>

          <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
            <span className="text-muted-foreground block text-[11px]">Cell Efficiency</span>
            <span className="font-bold text-foreground text-sm mt-0.5 block">
              {(solar.panel_efficiency * 100).toFixed(0)}% Monocrystalline
            </span>
          </div>

          <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
            <span className="text-muted-foreground block text-[11px]">Orientation</span>
            <span className="font-bold text-foreground text-sm mt-0.5 block capitalize">
              {solar.facing} ({solar.tilt_angle}°)
            </span>
          </div>

          <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
            <span className="text-muted-foreground block text-[11px]">Battery Pack</span>
            <span className="font-bold text-foreground text-sm mt-0.5 block">
              {solar.battery_capacity_kwh} kWh Li-Ion
            </span>
          </div>

          <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
            <span className="text-muted-foreground block text-[11px]">Commissioned</span>
            <span className="font-bold text-foreground text-sm mt-0.5 block">
              June 2023
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
